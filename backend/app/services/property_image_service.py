from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import ALLOW_LOCAL_MEDIA_IN_PRODUCTION, ENVIRONMENT
from app.database.models.property import Property
from app.database.models.property_image import PropertyImage
from app.database.models.user import User
from app.services.property_service import PropertyService
from app.services.storage.local import LocalDiskStorage
from app.services.storage.validation import detect_image_type

MAX_IMAGES_PER_PROPERTY = 15
MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024  # 8 MB

property_service = PropertyService()
storage = LocalDiskStorage(subfolder="properties")


class PropertyImageService:

    def _get_owned_property(
        self,
        db: Session,
        current_user: User,
        property_id: int,
    ) -> Property:
        # Reutiliza la comprobación de propiedad ya centralizada en
        # PropertyService (get_my_property ya valida OwnerProfile +
        # pertenencia del piso y lanza 403/404), para no duplicar esa
        # lógica de "solo el propietario del piso puede gestionarlo".
        return property_service.get_my_property(
            db, current_user, property_id,
        )

    async def upload_images(
        self,
        db: Session,
        current_user: User,
        property_id: int,
        files: list[UploadFile],
    ) -> Property:
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

        property_obj = self._get_owned_property(db, current_user, property_id)

        current_count = (
            db.query(PropertyImage)
            .filter(PropertyImage.property_id == property_obj.id)
            .count()
        )

        if current_count + len(files) > MAX_IMAGES_PER_PROPERTY:
            raise HTTPException(
                status_code=400,
                detail=(
                    "A property can have at most "
                    f"{MAX_IMAGES_PER_PROPERTY} images"
                ),
            )

        next_position = current_count
        has_cover = current_count > 0
        created: list[PropertyImage] = []

        try:
            for file in files:
                content = await file.read()

                if len(content) > MAX_IMAGE_SIZE_BYTES:
                    raise HTTPException(
                        status_code=400,
                        detail="Each image must be smaller than 8MB",
                    )

                image_type = detect_image_type(content)

                if image_type is None:
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            "Only JPEG, PNG or WebP images are allowed"
                        ),
                    )

                content_type = {
                    "jpeg": "image/jpeg",
                    "png": "image/png",
                    "webp": "image/webp",
                }[image_type]

                storage_key, url = storage.save(
                    content=content,
                    filename=file.filename or "image",
                    content_type=content_type,
                )

                image = PropertyImage(
                    property_id=property_obj.id,
                    storage_key=storage_key,
                    image_url=url,
                    position=next_position,
                    is_cover=not has_cover,
                )
                has_cover = True
                next_position += 1

                db.add(image)
                created.append(image)

            db.commit()

        except HTTPException:
            db.rollback()

            for image in created:
                storage.delete(image.storage_key)

            raise

        except Exception:
            db.rollback()
            raise

        return property_service.get_my_property(
            db, current_user, property_obj.id,
        )

    def delete_image(
        self,
        db: Session,
        current_user: User,
        property_id: int,
        image_id: int,
    ) -> Property:
        property_obj = self._get_owned_property(db, current_user, property_id)

        image = (
            db.query(PropertyImage)
            .filter(
                PropertyImage.id == image_id,
                PropertyImage.property_id == property_obj.id,
            )
            .first()
        )

        if image is None:
            raise HTTPException(status_code=404, detail="Image not found")

        was_cover = image.is_cover
        storage_key = image.storage_key

        try:
            db.delete(image)
            db.flush()

            if was_cover:
                next_cover = (
                    db.query(PropertyImage)
                    .filter(PropertyImage.property_id == property_obj.id)
                    .order_by(PropertyImage.position.asc())
                    .first()
                )

                if next_cover is not None:
                    next_cover.is_cover = True

            db.commit()

        except Exception:
            db.rollback()
            raise

        storage.delete(storage_key)

        return property_service.get_my_property(
            db, current_user, property_obj.id,
        )

    def set_cover(
        self,
        db: Session,
        current_user: User,
        property_id: int,
        image_id: int,
    ) -> Property:
        property_obj = self._get_owned_property(db, current_user, property_id)

        target = (
            db.query(PropertyImage)
            .filter(
                PropertyImage.id == image_id,
                PropertyImage.property_id == property_obj.id,
            )
            .first()
        )

        if target is None:
            raise HTTPException(status_code=404, detail="Image not found")

        try:
            db.query(PropertyImage).filter(
                PropertyImage.property_id == property_obj.id,
            ).update({PropertyImage.is_cover: False})

            target.is_cover = True

            db.commit()

        except Exception:
            db.rollback()
            raise

        return property_service.get_my_property(
            db, current_user, property_obj.id,
        )

    def reorder_images(
        self,
        db: Session,
        current_user: User,
        property_id: int,
        image_ids: list[int],
    ) -> Property:
        property_obj = self._get_owned_property(db, current_user, property_id)

        images = (
            db.query(PropertyImage)
            .filter(PropertyImage.property_id == property_obj.id)
            .all()
        )

        images_by_id = {image.id: image for image in images}

        if set(image_ids) != set(images_by_id.keys()):
            raise HTTPException(
                status_code=400,
                detail="image_ids must match exactly the property's images",
            )

        try:
            for position, image_id in enumerate(image_ids):
                images_by_id[image_id].position = position

            db.commit()

        except Exception:
            db.rollback()
            raise

        return property_service.get_my_property(
            db, current_user, property_obj.id,
        )
