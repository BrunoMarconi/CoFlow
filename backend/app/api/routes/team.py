"""Panel interno del equipo fundador: todas las viviendas de CoFlow.

Mientras PROPERTY_MARKETPLACE_ENABLED siga desactivado, este es el ÚNICO
sitio desde el que se puede ver una vivienda que no es tuya. Todas las
rutas exigen require_team_member (rol ADMIN + email del equipo).
"""

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, selectinload

from app.core.dependencies import require_team_member
from app.database.models.owner_profile import OwnerProfile
from app.database.models.property import Property, PropertyStatus
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.property import PropertyResponse
from app.schemas.property_image import PropertyImageOrderUpdate
from app.schemas.team import (
    TeamOwnerResponse,
    TeamPropertyDetailResponse,
    TeamPropertySummaryResponse,
    TeamPropertyUpdate,
)
from app.services import storage_service
from app.services.property_image_service import PropertyImageService
from app.services.property_service import PropertyService

router = APIRouter()

property_service = PropertyService()
property_image_service = PropertyImageService()

# Cuentas creadas en el alta asistida sin email real (ver
# assisted_listings.create_assisted_listing): no son un contacto válido.
PENDING_EMAIL_DOMAIN = "@coflow.pending"

OWNER_SEARCH_LIMIT = 30


def _like_pattern(raw: str) -> str:
    escaped = (
        raw.strip()
        .replace("\\", "\\\\")
        .replace("%", "\\%")
        .replace("_", "\\_")
    )
    return f"%{escaped}%"


def _owner_response(
    profile: OwnerProfile,
    property_count: int | None = None,
) -> TeamOwnerResponse:
    user = profile.user

    return TeamOwnerResponse(
        owner_profile_id=profile.id,
        user_id=user.id,
        owner_type=profile.owner_type,
        display_name=profile.display_name,
        company_name=profile.company_name,
        first_name=user.first_name,
        last_name=user.last_name,
        email=None if user.email.endswith(PENDING_EMAIL_DOMAIN) else user.email,
        phone=profile.phone or user.phone or None,
        account_activated=(
            user.password_hash is not None or user.google_id is not None
        ),
        property_count=property_count,
    )


def _cover_url(property_obj: Property) -> str | None:
    cover = next(
        (image for image in property_obj.images if image.is_cover),
        property_obj.images[0] if property_obj.images else None,
    )
    return storage_service.generate_public_url(cover.storage_key) if cover else None


def _active_property_count(db: Session, owner_profile_id: int) -> int:
    return (
        db.query(func.count(Property.id))
        .filter(
            Property.owner_profile_id == owner_profile_id,
            Property.status != PropertyStatus.ARCHIVED,
        )
        .scalar()
    )


def _detail(db: Session, property_obj: Property) -> TeamPropertyDetailResponse:
    base = PropertyResponse.model_validate(property_obj).model_dump()
    profile = property_obj.owner_profile

    return TeamPropertyDetailResponse(
        **base,
        owner=_owner_response(profile, _active_property_count(db, profile.id)),
        missing_fields=property_service.check_ready(property_obj),
    )


def _summary(property_obj: Property) -> TeamPropertySummaryResponse:
    return TeamPropertySummaryResponse(
        id=property_obj.id,
        title=property_obj.title,
        status=property_obj.status,
        property_type=property_obj.property_type,
        address_line=property_obj.address_line,
        city=property_obj.city,
        neighborhood=property_obj.neighborhood,
        postal_code=property_obj.postal_code,
        total_monthly_rent=property_obj.total_monthly_rent,
        deposit=property_obj.deposit,
        bedrooms=property_obj.bedrooms,
        bathrooms=property_obj.bathrooms,
        max_tenants=property_obj.max_tenants,
        surface_m2=property_obj.surface_m2,
        available_from=property_obj.available_from,
        cover_image_url=_cover_url(property_obj),
        image_count=len(property_obj.images),
        missing_fields=property_service.check_ready(property_obj),
        created_at=property_obj.created_at,
        updated_at=property_obj.updated_at,
        ready_at=property_obj.ready_at,
        owner=_owner_response(property_obj.owner_profile),
    )


@router.get("/properties", response_model=list[TeamPropertySummaryResponse])
def list_all_properties(
    q: str | None = Query(default=None, max_length=120),
    status: PropertyStatus | None = Query(default=None),
    owner_profile_id: int | None = Query(default=None),
    _team: User = Depends(require_team_member),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Property)
        .join(OwnerProfile, Property.owner_profile_id == OwnerProfile.id)
        .join(User, OwnerProfile.user_id == User.id)
        .options(
            selectinload(Property.images),
            selectinload(Property.owner_profile).selectinload(OwnerProfile.user),
        )
    )

    if status is not None:
        query = query.filter(Property.status == status)

    if owner_profile_id is not None:
        query = query.filter(Property.owner_profile_id == owner_profile_id)

    if q and q.strip():
        pattern = _like_pattern(q)
        query = query.filter(
            or_(
                *(
                    column.ilike(pattern, escape="\\")
                    for column in (
                        Property.title,
                        Property.address_line,
                        Property.neighborhood,
                        Property.postal_code,
                        OwnerProfile.display_name,
                        OwnerProfile.company_name,
                        User.first_name,
                        User.last_name,
                        User.email,
                    )
                )
            )
        )

    properties = query.order_by(Property.updated_at.desc()).all()
    return [_summary(item) for item in properties]


@router.get("/properties/{property_id}", response_model=TeamPropertyDetailResponse)
def get_any_property(
    property_id: int,
    _team: User = Depends(require_team_member),
    db: Session = Depends(get_db),
):
    return _detail(db, property_service.get_property_by_id(db, property_id))


@router.put("/properties/{property_id}", response_model=TeamPropertyDetailResponse)
def update_any_property(
    property_id: int,
    data: TeamPropertyUpdate,
    _team: User = Depends(require_team_member),
    db: Session = Depends(get_db),
):
    return _detail(db, property_service.update_property_admin(db, property_id, data))


@router.post("/properties/{property_id}/ready", response_model=TeamPropertyDetailResponse)
def mark_any_property_ready(
    property_id: int,
    _team: User = Depends(require_team_member),
    db: Session = Depends(get_db),
):
    return _detail(db, property_service.mark_ready_admin(db=db, property_id=property_id))


@router.post("/properties/{property_id}/images", response_model=TeamPropertyDetailResponse)
async def upload_any_property_images(
    property_id: int,
    files: list[UploadFile] = File(...),
    _team: User = Depends(require_team_member),
    db: Session = Depends(get_db),
):
    updated = await property_image_service.upload_images_admin(
        db=db, property_id=property_id, files=files,
    )
    return _detail(db, updated)


@router.delete(
    "/properties/{property_id}/images/{image_id}",
    response_model=TeamPropertyDetailResponse,
)
def delete_any_property_image(
    property_id: int,
    image_id: int,
    _team: User = Depends(require_team_member),
    db: Session = Depends(get_db),
):
    return _detail(db, property_image_service.delete_image_admin(db, property_id, image_id))


@router.post(
    "/properties/{property_id}/images/{image_id}/cover",
    response_model=TeamPropertyDetailResponse,
)
def set_any_property_image_cover(
    property_id: int,
    image_id: int,
    _team: User = Depends(require_team_member),
    db: Session = Depends(get_db),
):
    return _detail(db, property_image_service.set_cover_admin(db, property_id, image_id))


@router.put(
    "/properties/{property_id}/images/order",
    response_model=TeamPropertyDetailResponse,
)
def reorder_any_property_images(
    property_id: int,
    data: PropertyImageOrderUpdate,
    _team: User = Depends(require_team_member),
    db: Session = Depends(get_db),
):
    return _detail(
        db,
        property_image_service.reorder_images_admin(db, property_id, data.image_ids),
    )


@router.get("/owners", response_model=list[TeamOwnerResponse])
def search_owners(
    q: str | None = Query(default=None, max_length=120),
    _team: User = Depends(require_team_member),
    db: Session = Depends(get_db),
):
    counts = (
        db.query(
            Property.owner_profile_id.label("owner_profile_id"),
            func.count(Property.id).label("total"),
        )
        .filter(Property.status != PropertyStatus.ARCHIVED)
        .group_by(Property.owner_profile_id)
        .subquery()
    )
    total = func.coalesce(counts.c.total, 0)

    query = (
        db.query(OwnerProfile, total)
        .join(User, OwnerProfile.user_id == User.id)
        .outerjoin(counts, counts.c.owner_profile_id == OwnerProfile.id)
        .options(selectinload(OwnerProfile.user))
    )

    if q and q.strip():
        pattern = _like_pattern(q)
        query = query.filter(
            or_(
                *(
                    column.ilike(pattern, escape="\\")
                    for column in (
                        OwnerProfile.display_name,
                        OwnerProfile.company_name,
                        OwnerProfile.contact_email,
                        OwnerProfile.phone,
                        User.first_name,
                        User.last_name,
                        User.email,
                    )
                )
            )
        )

    rows = (
        query.order_by(total.desc(), OwnerProfile.display_name.asc())
        .limit(OWNER_SEARCH_LIMIT)
        .all()
    )
    return [_owner_response(profile, count) for profile, count in rows]


@router.get("/owners/{owner_profile_id}", response_model=TeamOwnerResponse)
def get_owner(
    owner_profile_id: int,
    _team: User = Depends(require_team_member),
    db: Session = Depends(get_db),
):
    profile = (
        db.query(OwnerProfile)
        .options(selectinload(OwnerProfile.user))
        .filter(OwnerProfile.id == owner_profile_id)
        .first()
    )

    if profile is None:
        raise HTTPException(status_code=404, detail="Owner not found")

    return _owner_response(profile, _active_property_count(db, profile.id))
