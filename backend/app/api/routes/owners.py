from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.owner_profile import (
    OwnerProfileCreate,
    OwnerProfileResponse,
    OwnerProfileUpdate,
)
from app.services.owner_profile_service import OwnerProfileService

router = APIRouter()

owner_profile_service = OwnerProfileService()


@router.post(
    "/me",
    response_model=OwnerProfileResponse,
)
def create_owner_profile(
    data: OwnerProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return owner_profile_service.create_profile(
        db=db,
        current_user=current_user,
        data=data,
    )


@router.get(
    "/me",
    response_model=OwnerProfileResponse | None,
)
def get_owner_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return owner_profile_service.get_my_profile(
        db=db,
        current_user=current_user,
    )


@router.put(
    "/me",
    response_model=OwnerProfileResponse,
)
def update_owner_profile(
    data: OwnerProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return owner_profile_service.update_profile(
        db=db,
        current_user=current_user,
        data=data,
    )
