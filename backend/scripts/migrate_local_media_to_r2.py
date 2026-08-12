"""Copia a R2 los medios persistentes que todavía existan en backend/media.

Uso desde ``backend``:

    python scripts/migrate_local_media_to_r2.py          # solo diagnóstico
    python scripts/migrate_local_media_to_r2.py --apply  # realiza la copia

Las claves de objeto se mantienen, por lo que no hace falta modificar la DB.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Permite ejecutar el archivo directamente desde backend/scripts.
BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from app.database.models.community import Community  # noqa: E402
from app.database.models.property_image import PropertyImage  # noqa: E402
from app.database.models.user import User  # noqa: E402
from app.database.models.user_photo import UserPhoto  # noqa: E402
from app.database.session import SessionLocal  # noqa: E402
from app.services.storage.r2 import (  # noqa: E402
    R2ConfigurationError,
    R2Storage,
    is_configured,
)

MEDIA_ROOT = BACKEND_ROOT / "media"


def _referenced_storage_keys() -> list[str]:
    db = SessionLocal()
    try:
        keys = {
            key
            for (key,) in db.query(User.avatar_storage_key)
            .filter(User.avatar_storage_key.is_not(None))
            .all()
            if key
        }
        keys.update(
            key
            for (key,) in db.query(UserPhoto.storage_key).all()
            if key
        )
        keys.update(
            key
            for (key,) in db.query(Community.cover_storage_key)
            .filter(Community.cover_storage_key.is_not(None))
            .all()
            if key
        )
        keys.update(
            key
            for (key,) in db.query(PropertyImage.storage_key).all()
            if key
        )
        return sorted(keys)
    finally:
        db.close()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Copia a Cloudflare R2 los medios locales de CoFlow."
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Realiza la copia. Sin esta opción solo muestra el diagnóstico.",
    )
    args = parser.parse_args()

    keys = _referenced_storage_keys()
    available = [key for key in keys if (MEDIA_ROOT / key).is_file()]
    missing = [key for key in keys if not (MEDIA_ROOT / key).is_file()]

    print(f"Referencias en base de datos: {len(keys)}")
    print(f"Archivos locales recuperables: {len(available)}")
    print(f"Archivos locales ausentes: {len(missing)}")

    if missing:
        print("No se pueden recuperar estas claves desde el disco local:")
        for key in missing:
            print(f"  - {key}")

    if not args.apply:
        print("Diagnóstico terminado. Usa --apply después de configurar R2.")
        return 0

    if not is_configured():
        raise R2ConfigurationError(
            "Configura R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, "
            "R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME y R2_PUBLIC_BASE_URL."
        )

    storage = R2Storage()
    copied = 0
    for key in available:
        storage.upload(
            content=(MEDIA_ROOT / key).read_bytes(),
            key=key,
            content_type="image/webp",
        )
        copied += 1
        print(f"Copiado: {key}")

    print(f"Migración terminada: {copied} archivos copiados a R2.")
    return 0 if not missing else 2


if __name__ == "__main__":
    raise SystemExit(main())
