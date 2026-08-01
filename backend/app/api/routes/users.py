from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.saved_profile import SavedProfileActionResponse
from app.schemas.user_connection import UserConnectionResponse
from app.schemas.user_public import PublicUserProfileResponse
from app.services.saved_profile_service import SavedProfileService
from app.services.user_connection_service import UserConnectionService
from app.services.user_service import UserService

router = APIRouter()

user_service = UserService()
saved_profile_service = SavedProfileService()
user_connection_service = UserConnectionService()


@router.get(
    "/public",
    response_model=list[PublicUserProfileResponse],
)
def list_public_users(
    max_budget: int | None = Query(default=None, ge=0),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_service.list_public_profiles(
        db=db,
        viewer=current_user,
        max_budget=max_budget,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/saved",
    response_model=list[PublicUserProfileResponse],
)
def list_saved_profiles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return saved_profile_service.list_saved_profiles(
        db=db,
        current_user=current_user,
    )


@router.post(
    "/{user_id}/save",
    response_model=SavedProfileActionResponse,
)
def save_user_profile(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    saved = saved_profile_service.save_profile(
        db=db,
        current_user=current_user,
        saved_user_id=user_id,
    )

    return SavedProfileActionResponse(saved=saved)


@router.delete(
    "/{user_id}/save",
    response_model=SavedProfileActionResponse,
)
def unsave_user_profile(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    saved = saved_profile_service.unsave_profile(
        db=db,
        current_user=current_user,
        saved_user_id=user_id,
    )

    return SavedProfileActionResponse(saved=saved)


@router.post(
    "/{user_id}/connections",
    response_model=UserConnectionResponse,
)
def create_connection_request(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_connection_service.create_connection_request(
        db=db,
        current_user=current_user,
        recipient_id=user_id,
    )


@router.get(
    "/{user_id}/public",
    response_model=PublicUserProfileResponse,
)
def get_public_user_profile(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_service.get_public_profile(
        db=db,
        user_id=user_id,
        viewer=current_user,
    )
