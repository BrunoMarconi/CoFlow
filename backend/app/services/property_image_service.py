from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import MAX_IMAGE_SIZE_BYTES
from app.database.models.property import Property
from app.database.models.property_image import PropertyImage
from app.database.models.user import User
from app.services import storage_service
from app.services.property_service import EDITABLE_STATUSES, PropertyService

MAX_IMAGES_PER_PROPERTY = 15

PROPERTY_IMAGE_SUBFOLDER = "properties"

property_service = PropertyService()


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
        property_obj = property_service.get_my_property(
            db, current_user, property_id,
        )

        # Mismo conjunto de estados que update_property — sin esto, las
        # fotos de un piso ya alquilado o archivado se podían seguir
        # añadiendo/borrando/reordenando aunque el resto de campos ya
        # estuviera bloqueado.
        if property_obj.status not in EDITABLE_STATUSES:
            raise HTTPException(
                status_code=409,
                detail="This property's photos cannot be edited in its current status",
            )

        return property_obj

    async def upload_images(
        self,
        db: Session,
        current_user: User,
        property_id: int,
        files: list[UploadFile],
    ) -> Property:
        property_obj = self._get_owned_property(db, current_user, property_id)
        await self._upload_images_to(db, property_obj, files)
        return property_service.get_my_property(db, current_user, property_obj.id)

    async def upload_images_admin(
        self,
        db: Session,
        property_id: int,
        files: list[UploadFile],
    ) -> Property:
        # Igual que upload_images pero sin exigir que current_user sea el
        # propietario: pensado para rutas ya protegidas por require_admin
        # (alta asistida), donde quien sube las fotos es el equipo.
        property_obj = property_service.get_property_by_id(db, property_id)

        if property_obj.status not in EDITABLE_STATUSES:
            raise HTTPException(
                status_code=409,
                detail="This property's photos cannot be edited in its current status",
            )

        await self._upload_images_to(db, property_obj, files)
        return property_service.get_property_by_id(db, property_obj.id)

    async def _upload_images_to(
        self,
        db: Session,
        property_obj: Property,
        files: list[UploadFile],
    ) -> None:
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

        # Valida y sube TODAS las imágenes antes de tocar la DB: si
        # alguna falla la validación, ninguna llega a subirse.
        validated_images = []
        for file in files:
            content = await file.read()
            validated_images.append(
                storage_service.validate_image(content, MAX_IMAGE_SIZE_BYTES)
            )

        uploaded: list[tuple[str, str]] = []

        try:
            for validated in validated_images:
                uploaded.append(
                    storage_service.upload_file(
                        validated, PROPERTY_IMAGE_SUBFOLDER
                    )
                )
        except Exception:
            for storage_key, _ in uploaded:
                storage_service.delete_file(
                    storage_key, PROPERTY_IMAGE_SUBFOLDER
                )
            raise

        next_position = current_count
        has_cover = current_count > 0
        created: list[PropertyImage] = []

        try:
            for storage_key, url in uploaded:
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

        except Exception:
            db.rollback()

            for storage_key, _ in uploaded:
                storage_service.delete_file(
                    storage_key, PROPERTY_IMAGE_SUBFOLDER
                )

            raise

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

        storage_service.delete_file(storage_key, PROPERTY_IMAGE_SUBFOLDER)

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
