from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import MAX_AVATAR_SIZE_BYTES, MAX_IMAGE_SIZE_BYTES
from app.database.models.user import User
from app.database.models.user_photo import UserPhoto
from app.services import storage_service

MAX_PHOTOS_PER_USER = 9
# Reexportados para no romper `from app.services.user_photo_service
# import MAX_AVATAR_SIZE_BYTES, MAX_PHOTO_SIZE_BYTES` en tests/otros
# módulos existentes — el valor real ahora vive en app.core.config
# (configurable por variable de entorno).
MAX_PHOTO_SIZE_BYTES = MAX_IMAGE_SIZE_BYTES

AVATAR_SUBFOLDER = "avatars"
PHOTO_SUBFOLDER = "user_photos"


def _reload_user(db: Session, current_user: User) -> User:
    # Recarga desde la sesión (no solo db.refresh de las columnas de
    # User) para que la relación `photos`, que puede haber cambiado de
    # tamaño/orden, se sirva siempre fresca en la respuesta.
    db.expire(current_user, ["photos"])
    db.refresh(current_user)
    return current_user


class UserPhotoService:

    async def upload_avatar(
        self,
        db: Session,
        current_user: User,
        file: UploadFile,
    ) -> User:
        content = await file.read()
        validated = storage_service.validate_image(content, MAX_AVATAR_SIZE_BYTES)

        # Sube primero, guarda en DB después: si R2 falla, el avatar
        # anterior (fila y archivo) sigue intacto — nunca se pierde.
        storage_key, url = storage_service.upload_file(validated, AVATAR_SUBFOLDER)

        previous_storage_key = current_user.avatar_storage_key

        try:
            current_user.avatar_url = url
            current_user.avatar_storage_key = storage_key
            db.commit()
        except Exception:
            db.rollback()
            storage_service.delete_file(storage_key, AVATAR_SUBFOLDER)
            raise

        if previous_storage_key:
            storage_service.delete_file(previous_storage_key, AVATAR_SUBFOLDER)

        return _reload_user(db, current_user)

    def delete_avatar(self, db: Session, current_user: User) -> User:
        storage_key = current_user.avatar_storage_key

        try:
            current_user.avatar_url = None
            current_user.avatar_storage_key = None
            db.commit()
        except Exception:
            db.rollback()
            raise

        if storage_key:
            storage_service.delete_file(storage_key, AVATAR_SUBFOLDER)

        return _reload_user(db, current_user)

    async def upload_photos(
        self,
        db: Session,
        current_user: User,
        files: list[UploadFile],
    ) -> User:
        current_count = (
            db.query(UserPhoto)
            .filter(UserPhoto.user_id == current_user.id)
            .count()
        )

        if current_count + len(files) > MAX_PHOTOS_PER_USER:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"A profile can have at most {MAX_PHOTOS_PER_USER} photos"
                ),
            )

        # Valida y sube TODAS las imágenes antes de tocar la DB: si
        # alguna falla la validación, ninguna llega a subirse.
        validated_images = []
        for file in files:
            content = await file.read()
            validated_images.append(
                storage_service.validate_image(content, MAX_PHOTO_SIZE_BYTES)
            )

        uploaded: list[tuple[str, str]] = []

        try:
            for validated in validated_images:
                uploaded.append(
                    storage_service.upload_file(validated, PHOTO_SUBFOLDER)
                )
        except Exception:
            for storage_key, _ in uploaded:
                storage_service.delete_file(storage_key, PHOTO_SUBFOLDER)
            raise

        next_position = current_count
        created: list[UserPhoto] = []

        try:
            for storage_key, url in uploaded:
                photo = UserPhoto(
                    user_id=current_user.id,
                    storage_key=storage_key,
                    image_url=url,
                    position=next_position,
                )
                next_position += 1

                db.add(photo)
                created.append(photo)

            db.commit()

        except Exception:
            db.rollback()

            for storage_key, _ in uploaded:
                storage_service.delete_file(storage_key, PHOTO_SUBFOLDER)

            raise

        return _reload_user(db, current_user)

    def delete_photo(
        self,
        db: Session,
        current_user: User,
        photo_id: int,
    ) -> User:
        photo = (
            db.query(UserPhoto)
            .filter(
                UserPhoto.id == photo_id,
                UserPhoto.user_id == current_user.id,
            )
            .first()
        )

        if photo is None:
            raise HTTPException(status_code=404, detail="Photo not found")

        storage_key = photo.storage_key

        try:
            db.delete(photo)
            db.commit()
        except Exception:
            db.rollback()
            raise

        storage_service.delete_file(storage_key, PHOTO_SUBFOLDER)

        return _reload_user(db, current_user)

    def reorder_photos(
        self,
        db: Session,
        current_user: User,
        photo_ids: list[int],
    ) -> User:
        photos = (
            db.query(UserPhoto)
            .filter(UserPhoto.user_id == current_user.id)
            .all()
        )

        photos_by_id = {photo.id: photo for photo in photos}

        if set(photo_ids) != set(photos_by_id.keys()):
            raise HTTPException(
                status_code=400,
                detail="photo_ids must match exactly the profile's photos",
            )

        try:
            for position, photo_id in enumerate(photo_ids):
                photos_by_id[photo_id].position = position

            db.commit()

        except Exception:
            db.rollback()
            raise

        return _reload_user(db, current_user)
