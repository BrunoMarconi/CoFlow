from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import ALLOW_LOCAL_MEDIA_IN_PRODUCTION, ENVIRONMENT
from app.database.models.user import User
from app.database.models.user_photo import UserPhoto
from app.services.storage.local import LocalDiskStorage
from app.services.storage.validation import detect_image_type

MAX_PHOTOS_PER_USER = 9
MAX_PHOTO_SIZE_BYTES = 8 * 1024 * 1024  # 8 MB
MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

_CONTENT_TYPE_BY_IMAGE_TYPE = {
    "jpeg": "image/jpeg",
    "png": "image/png",
    "webp": "image/webp",
}

avatar_storage = LocalDiskStorage(subfolder="avatars")
photo_storage = LocalDiskStorage(subfolder="user_photos")


def _block_in_production() -> None:
    if ENVIRONMENT == "production" and not ALLOW_LOCAL_MEDIA_IN_PRODUCTION:
        raise HTTPException(
            status_code=503,
            detail=(
                "Local image storage is disabled in production. "
                "Set ALLOW_LOCAL_MEDIA_IN_PRODUCTION=true only for "
                "temporary test deployments, or configure a real "
                "storage backend."
            ),
        )


async def _read_validated_image(
    file: UploadFile, max_size_bytes: int
) -> tuple[bytes, str]:
    content = await file.read()

    if len(content) > max_size_bytes:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Each image must be smaller than "
                f"{max_size_bytes // (1024 * 1024)}MB"
            ),
        )

    image_type = detect_image_type(content)

    if image_type is None:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG or WebP images are allowed",
        )

    return content, _CONTENT_TYPE_BY_IMAGE_TYPE[image_type]


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
        _block_in_production()

        content, content_type = await _read_validated_image(
            file, MAX_AVATAR_SIZE_BYTES
        )

        storage_key, url = avatar_storage.save(
            content=content,
            filename=file.filename or "avatar",
            content_type=content_type,
        )

        previous_storage_key = current_user.avatar_storage_key

        try:
            current_user.avatar_url = url
            current_user.avatar_storage_key = storage_key
            db.commit()
        except Exception:
            db.rollback()
            avatar_storage.delete(storage_key)
            raise

        if previous_storage_key:
            avatar_storage.delete(previous_storage_key)

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
            avatar_storage.delete(storage_key)

        return _reload_user(db, current_user)

    async def upload_photos(
        self,
        db: Session,
        current_user: User,
        files: list[UploadFile],
    ) -> User:
        _block_in_production()

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

        next_position = current_count
        created: list[UserPhoto] = []

        try:
            for file in files:
                content, content_type = await _read_validated_image(
                    file, MAX_PHOTO_SIZE_BYTES
                )

                storage_key, url = photo_storage.save(
                    content=content,
                    filename=file.filename or "photo",
                    content_type=content_type,
                )

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

        except HTTPException:
            db.rollback()

            for photo in created:
                photo_storage.delete(photo.storage_key)

            raise

        except Exception:
            db.rollback()
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

        photo_storage.delete(storage_key)

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
