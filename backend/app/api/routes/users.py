from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.models.compatibility_profile import CompatibilityProfile
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.compatibility_score import CompatibilityScoreResponse
from app.schemas.saved_profile import SavedProfileActionResponse
from app.schemas.user_connection import UserConnectionResponse
from app.schemas.user import ProfilePrivacyResponse, ProfilePrivacyUpdateRequest
from app.schemas.user_public import PublicUserProfileResponse
from app.schemas.user_safety import (
    BlockedUserResponse,
    UserBlockResponse,
    UserReportCreate,
    UserReportResponse,
)
from app.services.compatibility_score_service import compute_category_scores
from app.services.saved_profile_service import SavedProfileService
from app.services.user_connection_service import UserConnectionService
from app.services.user_service import UserService
from app.services.user_safety_service import UserSafetyService

router = APIRouter()

user_service = UserService()
saved_profile_service = SavedProfileService()
user_connection_service = UserConnectionService()
user_safety_service = UserSafetyService()


@router.get("/me/privacy", response_model=ProfilePrivacyResponse)
def get_profile_privacy(current_user: User = Depends(get_current_user)):
    return ProfilePrivacyResponse(profile_visibility=current_user.profile_visibility)


@router.get("/me/compatibility-score", response_model=CompatibilityScoreResponse)
def get_my_compatibility_score(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = (
        db.query(CompatibilityProfile)
        .filter(CompatibilityProfile.user_id == current_user.id)
        .first()
    )

    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Todavía no has completado el test de convivencia",
        )

    return CompatibilityScoreResponse(categories=compute_category_scores(profile))


@router.put("/me/privacy", response_model=ProfilePrivacyResponse)
def update_profile_privacy(
    data: ProfilePrivacyUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.profile_visibility = data.profile_visibility
    db.commit()
    db.refresh(current_user)
    return ProfilePrivacyResponse(profile_visibility=current_user.profile_visibility)


@router.get(
    "/blocked",
    response_model=list[BlockedUserResponse],
)
def list_blocked_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_safety_service.list_blocked_users(
        db=db,
        current_user=current_user,
    )


@router.get(
    "/public",
    response_model=list[PublicUserProfileResponse],
)
def list_public_users(
    max_budget: int | None = Query(default=None, ge=0),
    city: str | None = Query(default=None),
    community_status: str | None = Query(default=None, pattern="^(HAS_COMMUNITY|LOOKING)$"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_service.list_public_profiles(
        db=db,
        viewer=current_user,
        city=city,
        community_status=community_status,
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


@router.post(
    "/{user_id}/block",
    response_model=UserBlockResponse,
)
def block_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return UserBlockResponse(
        blocked=user_safety_service.block_user(
            db=db,
            current_user=current_user,
            blocked_user_id=user_id,
        )
    )


@router.delete(
    "/{user_id}/block",
    response_model=UserBlockResponse,
)
def unblock_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return UserBlockResponse(
        blocked=user_safety_service.unblock_user(
            db=db,
            current_user=current_user,
            blocked_user_id=user_id,
        )
    )


@router.post(
    "/{user_id}/report",
    response_model=UserReportResponse,
)
def report_user(
    user_id: UUID,
    data: UserReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = user_safety_service.report_user(
        db=db,
        current_user=current_user,
        reported_user_id=user_id,
        data=data,
    )
    return UserReportResponse(
        id=report.id,
        created_at=report.created_at,
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
