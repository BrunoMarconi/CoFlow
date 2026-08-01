import uuid
from pathlib import Path

from app.core.config import BACKEND_PUBLIC_URL
from app.services.storage.base import StorageBackend
from app.services.storage.validation import ALLOWED_IMAGE_TYPES

# Carpeta física donde se guardan las imágenes en desarrollo local.
# NOTA: esto es una implementación SOLO para desarrollo. En producción
# debe sustituirse por un backend real (S3, Cloudinary, Supabase
# Storage...) que implemente StorageBackend - no se debe desplegar
# esta implementación en un entorno con disco efímero o múltiples
# instancias, porque los archivos no se compartirían entre procesos.
MEDIA_ROOT = Path(__file__).resolve().parents[3] / "media"
MEDIA_URL_PREFIX = "/media"


class LocalDiskStorage(StorageBackend):
    def __init__(self, subfolder: str):
        self.subfolder = subfolder
        self.directory = MEDIA_ROOT / subfolder
        self.directory.mkdir(parents=True, exist_ok=True)

    def save(
        self,
        content: bytes,
        filename: str,
        content_type: str,
    ) -> tuple[str, str]:
        image_type = None

        for key, meta in ALLOWED_IMAGE_TYPES.items():
            if meta["content_type"] == content_type:
                image_type = key
                break

        ext = ALLOWED_IMAGE_TYPES[image_type]["ext"] if image_type else "bin"

        safe_name = f"{uuid.uuid4().hex}.{ext}"
        storage_key = f"{self.subfolder}/{safe_name}"

        destination = self.directory / safe_name
        destination.write_bytes(content)

        url = f"{BACKEND_PUBLIC_URL}{MEDIA_URL_PREFIX}/{storage_key}"

        return storage_key, url

    def delete(self, storage_key: str) -> None:
        path = MEDIA_ROOT / storage_key

        try:
            path.unlink(missing_ok=True)
        except OSError:
            pass
