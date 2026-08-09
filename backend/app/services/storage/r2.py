"""Backend de almacenamiento sobre Cloudflare R2, vía su API
compatible con S3 (boto3). R2 no cobra egress, por eso se prefiere
frente a S3 real para servir imágenes públicas.

El cliente boto3 se crea de forma perezosa (no al importar el módulo)
para no romper el arranque de la app si las credenciales todavía no
están configuradas — mismo patrón que el resto de integraciones
externas de este proyecto (TrueLayer, Resend, cifrado de tokens
bancarios): fallar en el momento de usarse, con un mensaje claro.
"""

import boto3
from botocore.client import Config as BotoConfig
from botocore.exceptions import BotoCoreError, ClientError

from app.core.config import (
    R2_ACCESS_KEY_ID,
    R2_ACCOUNT_ID,
    R2_BUCKET_NAME,
    R2_PUBLIC_BASE_URL,
    R2_SECRET_ACCESS_KEY,
)


class R2ConfigurationError(RuntimeError):
    """Faltan una o más variables R2_* necesarias para usar este backend."""


class R2UploadError(RuntimeError):
    """La subida a R2 falló (red, credenciales inválidas, bucket
    inexistente...). Quien la capture NUNCA debe haber tocado la DB
    todavía en ese punto — ver storage_service.upload_file."""


def is_configured() -> bool:
    return bool(
        R2_ACCOUNT_ID
        and R2_ACCESS_KEY_ID
        and R2_SECRET_ACCESS_KEY
        and R2_BUCKET_NAME
        and R2_PUBLIC_BASE_URL
    )


class R2Storage:
    def __init__(self) -> None:
        self._client = None

    def _get_client(self):
        if self._client is not None:
            return self._client

        if not is_configured():
            missing = [
                name
                for name, value in (
                    ("R2_ACCOUNT_ID", R2_ACCOUNT_ID),
                    ("R2_ACCESS_KEY_ID", R2_ACCESS_KEY_ID),
                    ("R2_SECRET_ACCESS_KEY", R2_SECRET_ACCESS_KEY),
                    ("R2_BUCKET_NAME", R2_BUCKET_NAME),
                    ("R2_PUBLIC_BASE_URL", R2_PUBLIC_BASE_URL),
                )
                if not value
            ]
            raise R2ConfigurationError(
                "Cloudflare R2 storage is not configured. Missing: "
                + ", ".join(missing)
            )

        self._client = boto3.client(
            "s3",
            endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
            aws_access_key_id=R2_ACCESS_KEY_ID,
            aws_secret_access_key=R2_SECRET_ACCESS_KEY,
            # R2 no tiene regiones reales; "auto" es el valor que espera.
            region_name="auto",
            config=BotoConfig(signature_version="s3v4"),
        )
        return self._client

    def upload(self, content: bytes, key: str, content_type: str) -> str:
        client = self._get_client()

        try:
            client.put_object(
                Bucket=R2_BUCKET_NAME,
                Key=key,
                Body=content,
                ContentType=content_type,
                # El bucket se sirve públicamente vía R2_PUBLIC_BASE_URL
                # (dominio r2.dev o dominio propio conectado al bucket),
                # no vía ACLs de objeto individuales — R2 las ignora.
            )
        except (ClientError, BotoCoreError) as error:
            raise R2UploadError(f"Failed to upload to R2: {error}") from error

        return f"{R2_PUBLIC_BASE_URL}/{key}"

    def delete(self, key: str) -> None:
        if not key:
            return

        try:
            client = self._get_client()
            client.delete_object(Bucket=R2_BUCKET_NAME, Key=key)
        except (R2ConfigurationError, ClientError, BotoCoreError):
            # Borrado "best effort": si R2 no está configurado o el
            # objeto ya no existe, no debe tumbar el flujo que lo llama
            # (p. ej. borrar el avatar anterior tras subir uno nuevo).
            pass

    def public_url(self, key: str) -> str:
        return f"{R2_PUBLIC_BASE_URL}/{key}"
