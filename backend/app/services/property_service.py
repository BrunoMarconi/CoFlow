from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session, selectinload

from app.database.models.amenity import Amenity
from app.database.models.owner_profile import OwnerProfile
from app.database.models.property import Property, PropertyStatus
from app.database.models.property_amenity import PropertyAmenity
from app.database.models.user import User
from app.schemas.property import PropertyCreate, PropertyUpdate

EDITABLE_STATUSES = {
    PropertyStatus.DRAFT,
    PropertyStatus.READY,
    PropertyStatus.PAUSED,
}


class PropertyService:

    def _load_options(self):
        return (
            selectinload(Property.images),
            selectinload(Property.amenity_links).selectinload(
                PropertyAmenity.amenity
            ),
        )

    def _enrich(self, property_obj: Property) -> Property:
        property_obj.amenities = [
            link.amenity for link in property_obj.amenity_links
        ]
        return property_obj

    def _get_owner_profile(
        self,
        db: Session,
        current_user: User,
    ) -> OwnerProfile:
        profile = (
            db.query(OwnerProfile)
            .filter(OwnerProfile.user_id == current_user.id)
            .first()
        )

        if profile is None:
            raise HTTPException(
                status_code=403,
                detail="You need an owner profile to manage properties",
            )

        return profile

    def _get_own_property(
        self,
        db: Session,
        current_user: User,
        property_id: int,
    ) -> Property:
        profile = self._get_owner_profile(db, current_user)

        property_obj = (
            db.query(Property)
            .options(*self._load_options())
            .filter(
                Property.id == property_id,
                Property.owner_profile_id == profile.id,
            )
            .first()
        )

        if property_obj is None:
            raise HTTPException(
                status_code=404,
                detail="Property not found",
            )

        return property_obj

    def _set_amenities(
        self,
        db: Session,
        property_obj: Property,
        amenity_ids: list[int],
    ) -> None:
        db.query(PropertyAmenity).filter(
            PropertyAmenity.property_id == property_obj.id,
        ).delete()

        if not amenity_ids:
            return

        valid_ids = {
            row[0]
            for row in db.query(Amenity.id).filter(
                Amenity.id.in_(amenity_ids),
                Amenity.is_active.is_(True),
            ).all()
        }

        for amenity_id in valid_ids:
            db.add(
                PropertyAmenity(
                    property_id=property_obj.id,
                    amenity_id=amenity_id,
                )
            )

    def create_property(
        self,
        db: Session,
        current_user: User,
        data: PropertyCreate,
    ) -> Property:
        profile = self._get_owner_profile(db, current_user)

        property_obj = Property(
            owner_profile_id=profile.id,
            title=data.title.strip(),
            description=data.description.strip(),
            property_type=data.property_type,
            status=PropertyStatus.DRAFT,
            address_line=data.address_line.strip(),
            city=data.city.strip(),
            province=data.province.strip(),
            postal_code=data.postal_code.strip(),
            neighborhood=(
                data.neighborhood.strip() if data.neighborhood else None
            ),
            latitude=data.latitude,
            longitude=data.longitude,
            surface_m2=data.surface_m2,
            bedrooms=data.bedrooms,
            bathrooms=data.bathrooms,
            floor=data.floor,
            has_elevator=data.has_elevator,
            furnished=data.furnished,
            max_tenants=data.max_tenants,
            total_monthly_rent=data.total_monthly_rent,
            deposit=data.deposit,
            utilities_included=data.utilities_included,
            available_from=data.available_from,
            minimum_stay_months=data.minimum_stay_months,
            pets_allowed=data.pets_allowed,
            smoking_allowed=data.smoking_allowed,
            couples_allowed=data.couples_allowed,
            students_allowed=data.students_allowed,
            registration_allowed=data.registration_allowed,
            additional_requirements=data.additional_requirements,
        )

        try:
            db.add(property_obj)
            db.flush()

            self._set_amenities(db, property_obj, data.amenity_ids)

            db.commit()

        except Exception:
            db.rollback()
            raise

        return self.get_my_property(db, current_user, property_obj.id)

    def list_my_properties(
        self,
        db: Session,
        current_user: User,
        include_archived: bool = False,
    ) -> list[Property]:
        profile = self._get_owner_profile(db, current_user)

        query = db.query(Property).options(*self._load_options()).filter(
            Property.owner_profile_id == profile.id,
        )

        if not include_archived:
            query = query.filter(
                Property.status != PropertyStatus.ARCHIVED,
            )

        properties = query.order_by(Property.updated_at.desc()).all()

        return [self._enrich(item) for item in properties]

    def get_my_property(
        self,
        db: Session,
        current_user: User,
        property_id: int,
    ) -> Property:
        property_obj = self._get_own_property(db, current_user, property_id)
        return self._enrich(property_obj)

    def update_property(
        self,
        db: Session,
        current_user: User,
        property_id: int,
        data: PropertyUpdate,
    ) -> Property:
        property_obj = self._get_own_property(db, current_user, property_id)

        if property_obj.status not in EDITABLE_STATUSES:
            raise HTTPException(
                status_code=409,
                detail="This property cannot be edited in its current status",
            )

        update_data = data.model_dump(
            exclude_unset=True,
            exclude={"amenity_ids"},
        )

        for field, value in update_data.items():
            setattr(property_obj, field, value)

        try:
            if data.amenity_ids is not None:
                self._set_amenities(db, property_obj, data.amenity_ids)

            db.commit()

        except Exception:
            db.rollback()
            raise

        return self.get_my_property(db, current_user, property_obj.id)

    def _missing_ready_fields(self, property_obj: Property) -> list[str]:
        missing: list[str] = []

        def require(condition: bool, label: str) -> None:
            if not condition:
                missing.append(label)

        require(bool(property_obj.title), "título")
        require(
            bool(property_obj.description)
            and len(property_obj.description) >= 30,
            "descripción",
        )
        require(property_obj.property_type is not None, "tipo de vivienda")
        require(bool(property_obj.address_line), "dirección")
        require(bool(property_obj.city), "ciudad")
        require(bool(property_obj.province), "provincia")
        require(bool(property_obj.postal_code), "código postal")
        require(property_obj.bedrooms is not None, "habitaciones")
        require(property_obj.bathrooms is not None, "baños")
        require(property_obj.max_tenants is not None, "máximo de inquilinos")
        require(
            property_obj.total_monthly_rent is not None,
            "alquiler mensual total",
        )
        require(property_obj.deposit is not None, "fianza")
        require(property_obj.available_from is not None, "fecha disponible")
        require(len(property_obj.images) >= 1, "fotografías")

        return missing

    def check_ready(self, property_obj: Property) -> list[str]:
        return self._missing_ready_fields(property_obj)

    def mark_ready(
        self,
        db: Session,
        current_user: User,
        property_id: int,
    ) -> Property:
        property_obj = self._get_own_property(db, current_user, property_id)

        if property_obj.status not in (
            PropertyStatus.DRAFT,
            PropertyStatus.PAUSED,
        ):
            raise HTTPException(
                status_code=409,
                detail="Only draft or paused properties can be marked ready",
            )

        missing = self._missing_ready_fields(property_obj)

        if missing:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": (
                        "El piso todavía no puede marcarse como preparado."
                    ),
                    "missing_fields": missing,
                },
            )

        property_obj.status = PropertyStatus.READY
        property_obj.ready_at = datetime.now(timezone.utc)

        try:
            db.commit()

        except Exception:
            db.rollback()
            raise

        return self.get_my_property(db, current_user, property_obj.id)

    def pause(
        self,
        db: Session,
        current_user: User,
        property_id: int,
    ) -> Property:
        property_obj = self._get_own_property(db, current_user, property_id)

        if property_obj.status != PropertyStatus.READY:
            raise HTTPException(
                status_code=409,
                detail="Only ready properties can be paused",
            )

        property_obj.status = PropertyStatus.PAUSED

        try:
            db.commit()

        except Exception:
            db.rollback()
            raise

        return self.get_my_property(db, current_user, property_obj.id)

    def resume(
        self,
        db: Session,
        current_user: User,
        property_id: int,
    ) -> Property:
        # "Reanudar" desde PAUSED reutiliza la misma validación de
        # campos obligatorios: mientras estaba en pausa, el propietario
        # pudo haber editado el piso y dejarlo incompleto.
        return self.mark_ready(db, current_user, property_id)

    def mark_rented(
        self,
        db: Session,
        current_user: User,
        property_id: int,
    ) -> Property:
        property_obj = self._get_own_property(db, current_user, property_id)

        if property_obj.status not in (
            PropertyStatus.READY,
            PropertyStatus.PAUSED,
        ):
            raise HTTPException(
                status_code=409,
                detail="Only ready or paused properties can be marked "
                "as rented",
            )

        property_obj.status = PropertyStatus.RENTED
        property_obj.rented_at = datetime.now(timezone.utc)

        try:
            db.commit()

        except Exception:
            db.rollback()
            raise

        return self.get_my_property(db, current_user, property_obj.id)

    def archive(
        self,
        db: Session,
        current_user: User,
        property_id: int,
    ) -> Property:
        property_obj = self._get_own_property(db, current_user, property_id)

        if property_obj.status == PropertyStatus.ARCHIVED:
            raise HTTPException(
                status_code=409,
                detail="This property is already archived",
            )

        property_obj.status = PropertyStatus.ARCHIVED
        property_obj.archived_at = datetime.now(timezone.utc)

        try:
            db.commit()

        except Exception:
            db.rollback()
            raise

        return self.get_my_property(db, current_user, property_obj.id)
