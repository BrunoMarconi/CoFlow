"""Punto único de entrada para subir/borrar/validar imágenes de
usuario: avatares, fotos de perfil, fotos de piso y, en el futuro,
imágenes de comunidad. Ningún otro módulo debe hablar directamente con
R2 o con el disco local — todos pasan por aquí.

Backend activo (se decide en cada llamada, no una sola vez al
arrancar, para que los tests puedan simular ambos casos):
- Cloudflare R2 (S3-compatible, vía boto3) si las cinco variables
  R2_* están configuradas — persistente, el único válido en
  producción.
- Disco local (app/services/storage/local.py) si no lo están — SOLO
  para desarrollo. En producción sin R2 configurado, la subida se
  bloquea con un 503 explícito en vez de guardar en el disco efímero
  de Render, donde los archivos desaparecen en el siguiente
  redeploy/reinicio (ese fue exactamente el incidente que motivó esta
  migración).

Todas las imágenes se normalizan a WebP al subirlas (ver
validate_image): esto además de reducir peso, obliga a que el
archivo se decodifique como una imagen raster real con Pillow, no
solo a que "parezca" una por sus primeros bytes — un SVG (texto) o un
archivo corrupto que imite una cabecera válida nunca sobrevive a esto.
"""

from dataclasses import dataclass
from io import BytesIO
from uuid import uuid4

from fastapi import HTTPException
from PIL import Image, ImageOps, UnidentifiedImageError

from app.core.config import ALLOW_LOCAL_MEDIA_IN_PRODUCTION, BACKEND_PUBLIC_URL, ENVIRONMENT
from app.services.storage.local import LocalDiskStorage
from app.services.storage.r2 import R2Storage
from app.services.storage.r2 import is_configured as r2_is_configured
from app.services.storage.validation import detect_image_type

WEBP_QUALITY = 82

_local_storage_by_subfolder: dict[str, LocalDiskStorage] = {}
_r2_storage = R2Storage()


def _get_local_storage(subfolder: str) -> LocalDiskStorage:
    if subfolder not in _local_storage_by_subfolder:
        _local_storage_by_subfolder[subfolder] = LocalDiskStorage(subfolder=subfolder)
    return _local_storage_by_subfolder[subfolder]


@dataclass(frozen=True)
class ValidatedImage:
    content: bytes
    content_type: str
    extension: str


def validate_image(content: bytes, max_size_bytes: int) -> ValidatedImage:
    """Valida un archivo subido por el usuario y lo normaliza a WebP.

    Nunca confía en la extensión del nombre de archivo ni en el
    Content-Type que declara el cliente:
    1. Comprueba la firma binaria real (magic bytes) — descarta SVG y
       cualquier cosa que no sea JPEG/PNG/WebP de entrada.
    2. Decodifica el archivo completo con Pillow (no solo la
       cabecera), lo que además rechaza archivos corruptos o
       truncados que superasen el paso 1.
    3. Re-orienta según EXIF y re-codifica a WebP, perdiendo cualquier
       metadato incrustado (privacidad) y normalizando el formato de
       salida sea cual sea el de entrada.
    """
    if len(content) > max_size_bytes:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Each image must be smaller than "
                f"{max_size_bytes // (1024 * 1024)}MB"
            ),
        )

    if detect_image_type(content) is None:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG or WebP images are allowed",
        )

    try:
        with Image.open(BytesIO(content)) as probe:
            probe.verify()

        with Image.open(BytesIO(content)) as image:
            image = ImageOps.exif_transpose(image) or image

            if image.mode not in ("RGB", "RGBA"):
                has_alpha = "A" in image.getbands() or image.mode in ("P", "LA")
                image = image.convert("RGBA" if has_alpha else "RGB")

            buffer = BytesIO()
            image.save(buffer, format="WEBP", quality=WEBP_QUALITY)
            normalized_content = buffer.getvalue()
    except (UnidentifiedImageError, OSError, ValueError) as error:
        raise HTTPException(
            status_code=400,
            detail="Invalid image file",
        ) from error

    return ValidatedImage(
        content=normalized_content,
        content_type="image/webp",
        extension="webp",
    )


def _block_local_storage_in_production() -> None:
    if ENVIRONMENT == "production" and not ALLOW_LOCAL_MEDIA_IN_PRODUCTION:
        raise HTTPException(
            status_code=503,
            detail=(
                "Image storage is not configured for production. Set the "
                "R2_* environment variables (Cloudflare R2) so uploads "
                "persist across deploys, instead of writing to Render's "
                "ephemeral local disk."
            ),
        )


def upload_file(image: ValidatedImage, subfolder: str) -> tuple[str, str]:
    """Sube una imagen YA VALIDADA (ver validate_image) y devuelve
    (storage_key, url_publica).

    El nombre de archivo es siempre un UUID generado aquí, nunca algo
    derivado de lo que suba el usuario: evita colisiones y hace
    estructuralmente imposible el path traversal (no hay ningún dato
    de entrada del usuario en la construcción de la key)."""
    if r2_is_configured():
        key = f"{subfolder}/{uuid4().hex}.{image.extension}"
        url = _r2_storage.upload(
            content=image.content, key=key, content_type=image.content_type
        )
        return key, url

    _block_local_storage_in_production()

    return _get_local_storage(subfolder).save(
        content=image.content,
        filename=f"upload.{image.extension}",
        content_type=image.content_type,
    )


def delete_file(storage_key: str, subfolder: str) -> None:
    """Borrado best-effort: nunca lanza, para no romper un flujo (p.
    ej. reemplazar un avatar) por culpa de que el archivo anterior ya
    no exista. Si R2 está configurado se borra ahí; si el storage_key
    pertenece a una subida "legacy" en disco local (de antes de
    configurar R2), ese archivo local puede quedar huérfano — es
    aceptable: son subidas de un despliegue efímero que probablemente
    ya se perdieron de todas formas."""
    if not storage_key:
        return

    if r2_is_configured():
        _r2_storage.delete(storage_key)
        return

    _get_local_storage(subfolder).delete(storage_key)


def generate_public_url(storage_key: str) -> str:
    if r2_is_configured():
        return _r2_storage.public_url(storage_key)

    return f"{BACKEND_PUBLIC_URL}/media/{storage_key}"
