from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_verified_email
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.community_invitation import (
    CommunityInvitationDetailResponse,
    CommunityInvitationInboxResponse,
    CommunityInvitationResponse,
)
from app.services.community_invitation_service import (
    CommunityInvitationService,
)

router = APIRouter()

community_invitation_service = CommunityInvitationService()


@router.get(
    "",
    response_model=list[CommunityInvitationInboxResponse],
)
def list_received_invitations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return community_invitation_service.list_received_invitations(
        db=db,
        current_user=current_user,
    )


@router.get(
    "/{token}",
    response_model=CommunityInvitationDetailResponse,
)
def get_invitation(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return community_invitation_service.get_invitation_detail(
        db=db,
        token=token,
        current_user=current_user,
    )


@router.post(
    "/{token}/accept",
    response_model=CommunityInvitationResponse,
)
def accept_invitation(
    token: str,
    current_user: User = Depends(require_verified_email),
    db: Session = Depends(get_db),
):
    return community_invitation_service.accept_invitation(
        db=db,
        current_user=current_user,
        token=token,
    )


@router.post(
    "/{token}/decline",
    response_model=CommunityInvitationResponse,
)
def decline_invitation(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return community_invitation_service.decline_invitation(
        db=db,
        current_user=current_user,
        token=token,
    )
