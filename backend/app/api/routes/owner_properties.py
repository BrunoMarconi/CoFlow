from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_verified_email
from app.database.models.property import Property
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.property import (
    PropertyCreate,
    PropertyReadyCheckResponse,
    PropertyResponse,
    PropertySummaryResponse,
    PropertyUpdate,
)
from app.schemas.property_image import (
    PropertyImageOrderUpdate,
    PropertyImageResponse,
)
from app.services import billing_service, storage_service
from app.services.property_image_service import PropertyImageService
from app.services.property_service import PropertyService

router = APIRouter()

property_service = PropertyService()
property_image_service = PropertyImageService()


def _to_summary(property_obj: Property) -> PropertySummaryResponse:
    cover = next(
        (image for image in property_obj.images if image.is_cover),
        property_obj.images[0] if property_obj.images else None,
    )

    return PropertySummaryResponse(
        id=property_obj.id,
        title=property_obj.title,
        status=property_obj.status,
        property_type=property_obj.property_type,
        city=property_obj.city,
        neighborhood=property_obj.neighborhood,
        total_monthly_rent=property_obj.total_monthly_rent,
        bedrooms=property_obj.bedrooms,
        max_tenants=property_obj.max_tenants,
        cover_image_url=(
            storage_service.generate_public_url(cover.storage_key)
            if cover
            else None
        ),
        subscription_status=property_obj.subscription_status,
        trial_ends_at=property_obj.trial_ends_at,
        updated_at=property_obj.updated_at,
    )


@router.post(
    "",
    response_model=PropertyResponse,
)
def create_property(
    data: PropertyCreate,
    current_user: User = Depends(require_verified_email),
    db: Session = Depends(get_db),
):
    return property_service.create_property(
        db=db,
        current_user=current_user,
        data=data,
    )


@router.get(
    "",
    response_model=list[PropertySummaryResponse],
)
def list_my_properties(
    include_archived: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    properties = property_service.list_my_properties(
        db=db,
        current_user=current_user,
        include_archived=include_archived,
    )

    return [_to_summary(item) for item in properties]


@router.get(
    "/{property_id}",
    response_model=PropertyResponse,
)
def get_my_property(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return property_service.get_my_property(
        db=db,
        current_user=current_user,
        property_id=property_id,
    )


@router.get(
    "/{property_id}/ready-check",
    response_model=PropertyReadyCheckResponse,
)
def check_property_ready(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    property_obj = property_service.get_my_property(
        db=db,
        current_user=current_user,
        property_id=property_id,
    )

    missing = property_service.check_ready(property_obj)

    return PropertyReadyCheckResponse(
        ready=len(missing) == 0,
        missing_fields=missing,
    )


@router.put(
    "/{property_id}",
    response_model=PropertyResponse,
)
def update_property(
    property_id: int,
    data: PropertyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return property_service.update_property(
        db=db,
        current_user=current_user,
        property_id=property_id,
        data=data,
    )


@router.post(
    "/{property_id}/ready",
    response_model=PropertyResponse,
)
def mark_property_ready(
    property_id: int,
    current_user: User = Depends(require_verified_email),
    db: Session = Depends(get_db),
):
    return property_service.mark_ready(
        db=db,
        current_user=current_user,
        property_id=property_id,
    )


@router.post(
    "/{property_id}/subscribe",
    response_model=PropertyResponse,
)
def subscribe_property(
    property_id: int,
    current_user: User = Depends(require_verified_email),
    db: Session = Depends(get_db),
):
    property_obj = property_service.get_my_property(
        db=db,
        current_user=current_user,
        property_id=property_id,
    )

    billing_service.start_property_subscription(
        db=db,
        current_user=current_user,
        property_obj=property_obj,
    )

    return property_service.get_my_property(
        db=db,
        current_user=current_user,
        property_id=property_id,
    )


@router.post(
    "/{property_id}/pause",
    response_model=PropertyResponse,
)
def pause_property(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return property_service.pause(
        db=db,
        current_user=current_user,
        property_id=property_id,
    )


@router.post(
    "/{property_id}/resume",
    response_model=PropertyResponse,
)
def resume_property(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return property_service.resume(
        db=db,
        current_user=current_user,
        property_id=property_id,
    )


@router.post(
    "/{property_id}/mark-rented",
    response_model=PropertyResponse,
)
def mark_property_rented(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return property_service.mark_rented(
        db=db,
        current_user=current_user,
        property_id=property_id,
    )


@router.post(
    "/{property_id}/archive",
    response_model=PropertyResponse,
)
def archive_property(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return property_service.archive(
        db=db,
        current_user=current_user,
        property_id=property_id,
    )


@router.post(
    "/{property_id}/images",
    response_model=PropertyResponse,
)
async def upload_property_images(
    property_id: int,
    files: list[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await property_image_service.upload_images(
        db=db,
        current_user=current_user,
        property_id=property_id,
        files=files,
    )


@router.delete(
    "/{property_id}/images/{image_id}",
    response_model=PropertyResponse,
)
def delete_property_image(
    property_id: int,
    image_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return property_image_service.delete_image(
        db=db,
        current_user=current_user,
        property_id=property_id,
        image_id=image_id,
    )


@router.put(
    "/{property_id}/images/order",
    response_model=PropertyResponse,
)
def reorder_property_images(
    property_id: int,
    data: PropertyImageOrderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return property_image_service.reorder_images(
        db=db,
        current_user=current_user,
        property_id=property_id,
        image_ids=data.image_ids,
    )


@router.post(
    "/{property_id}/images/{image_id}/cover",
    response_model=PropertyResponse,
)
def set_property_image_cover(
    property_id: int,
    image_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return property_image_service.set_cover(
        db=db,
        current_user=current_user,
        property_id=property_id,
        image_id=image_id,
    )
