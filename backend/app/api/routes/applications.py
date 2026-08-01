from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.community_application import CommunityApplicationResponse
from app.services.community_application_service import (
    CommunityApplicationService,
)

router = APIRouter()

community_application_service = CommunityApplicationService()


@router.get(
    "/me",
    response_model=list[CommunityApplicationResponse],
)
def list_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return community_application_service.list_my_applications(
        db=db,
        current_user=current_user,
    )


@router.post(
    "/{application_id}/accept",
    response_model=CommunityApplicationResponse,
)
def accept_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return community_application_service.accept_application(
        db=db,
        current_user=current_user,
        application_id=application_id,
    )


@router.post(
    "/{application_id}/reject",
    response_model=CommunityApplicationResponse,
)
def reject_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return community_application_service.reject_application(
        db=db,
        current_user=current_user,
        application_id=application_id,
    )


@router.post(
    "/{application_id}/cancel",
    response_model=CommunityApplicationResponse,
)
def cancel_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return community_application_service.cancel_application(
        db=db,
        current_user=current_user,
        application_id=application_id,
    )
