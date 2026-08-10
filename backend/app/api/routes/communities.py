from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_verified_email
from app.database.models.community import CommunityProfileType
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.community import (
    CommunityCreate,
    CommunityResponse,
    CommunityUpdate,
)
from app.schemas.community_message import (
    CommunityMessageCreate,
    CommunityMessageResponse,
)
from app.schemas.community_rent_split import (
    CommunityRentSplitResponse,
    CommunityRentSplitUpdate,
)
from app.schemas.community_invitation import CommunityInvitationResponse
from app.schemas.community_application import (
    CommunityApplicationCreate,
    CommunityApplicationResponse,
)
from app.services.community_service import CommunityService
from app.services.community_message_service import CommunityMessageService
from app.services.community_rent_split_service import (
    CommunityRentSplitService,
)
from app.services.community_invitation_service import (
    CommunityInvitationService,
)
from app.services.community_application_service import (
    CommunityApplicationService,
)

router = APIRouter()

community_service = CommunityService()
community_message_service = CommunityMessageService()
community_rent_split_service = CommunityRentSplitService()
community_invitation_service = CommunityInvitationService()
community_application_service = CommunityApplicationService()


@router.get(
    "",
    response_model=list[CommunityResponse],
)
def list_communities(
    city: str | None = Query(default=None),
    province: str | None = Query(default=None),
    profile_type: CommunityProfileType | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return community_service.get_communities(
        db=db,
        current_user=current_user,
        city=city,
        province=province,
        profile_type=profile_type,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/me",
    response_model=CommunityResponse | None,
)
def get_my_community(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return community_service.get_my_active_community(
        db=db,
        current_user=current_user,
    )


@router.post(
    "/{community_id}/join",
    response_model=CommunityResponse,
)
def join_open_community(
    community_id: int,
    current_user: User = Depends(require_verified_email),
    db: Session = Depends(get_db),
):
    return community_service.join_open_community(
        db=db,
        current_user=current_user,
        community_id=community_id,
    )


@router.delete(
    "/{community_id}/members/me",
    response_model=CommunityResponse,
)
def leave_community(
    community_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return community_service.leave_community(
        db=db,
        current_user=current_user,
        community_id=community_id,
    )


@router.get(
    "/{community_id}/messages",
    response_model=list[CommunityMessageResponse],
)
def list_community_messages(
    community_id: int,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return community_message_service.get_messages(
        db=db,
        community_id=community_id,
        current_user=current_user,
        skip=skip,
        limit=limit,
    )


@router.post(
    "/{community_id}/messages",
    response_model=CommunityMessageResponse,
)
def create_community_message(
    community_id: int,
    data: CommunityMessageCreate,
    current_user: User = Depends(require_verified_email),
    db: Session = Depends(get_db),
):
    return community_message_service.create_message(
        db=db,
        community_id=community_id,
        current_user=current_user,
        data=data,
    )


@router.get(
    "/{community_id}/rent-split",
    response_model=CommunityRentSplitResponse,
)
def get_community_rent_split(
    community_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return community_rent_split_service.get_rent_split(
        db=db,
        community_id=community_id,
        current_user=current_user,
    )


@router.put(
    "/{community_id}/rent-split",
    response_model=CommunityRentSplitResponse,
)
def update_community_rent_split(
    community_id: int,
    data: CommunityRentSplitUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return community_rent_split_service.update_rent_split(
        db=db,
        community_id=community_id,
        current_user=current_user,
        data=data,
    )


@router.post(
    "/{community_id}/invitations",
    response_model=CommunityInvitationResponse,
)
def create_community_invitation(
    community_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return community_invitation_service.create_invitation(
        db=db,
        current_user=current_user,
        community_id=community_id,
    )


@router.get(
    "/{community_id}/invitations",
    response_model=list[CommunityInvitationResponse],
)
def list_community_invitations(
    community_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return community_invitation_service.list_invitations(
        db=db,
        current_user=current_user,
        community_id=community_id,
    )


@router.delete(
    "/{community_id}/invitations/{invitation_id}",
    response_model=CommunityInvitationResponse,
)
def cancel_community_invitation(
    community_id: int,
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return community_invitation_service.cancel_invitation(
        db=db,
        current_user=current_user,
        community_id=community_id,
        invitation_id=invitation_id,
    )


@router.post(
    "/{community_id}/applications",
    response_model=CommunityApplicationResponse,
)
def create_community_application(
    community_id: int,
    data: CommunityApplicationCreate,
    current_user: User = Depends(require_verified_email),
    db: Session = Depends(get_db),
):
    return community_application_service.create_application(
        db=db,
        current_user=current_user,
        community_id=community_id,
        data=data,
    )


@router.get(
    "/{community_id}/applications",
    response_model=list[CommunityApplicationResponse],
)
def list_community_applications(
    community_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return community_application_service.list_applications(
        db=db,
        current_user=current_user,
        community_id=community_id,
    )


@router.get(
    "/{community_id}",
    response_model=CommunityResponse,
)
def get_community(
    community_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return community_service.get_community_by_id(
        db=db,
        community_id=community_id,
        current_user=current_user,
    )


@router.post(
    "",
    response_model=CommunityResponse,
)
def create_community(
    data: CommunityCreate,
    current_user: User = Depends(require_verified_email),
    db: Session = Depends(get_db),
):
    return community_service.create_community(
        db=db,
        current_user=current_user,
        data=data,
    )


@router.put(
    "/{community_id}",
    response_model=CommunityResponse,
)
def update_community(
    community_id: int,
    data: CommunityUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return community_service.update_community(
        db=db,
        current_user=current_user,
        community_id=community_id,
        data=data,
    )


@router.post(
    "/{community_id}/cover",
    response_model=CommunityResponse,
)
async def upload_community_cover(
    community_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await community_service.upload_cover_image(
        db=db,
        current_user=current_user,
        community_id=community_id,
        file=file,
    )


@router.delete(
    "/{community_id}/cover",
    response_model=CommunityResponse,
)
def delete_community_cover(
    community_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return community_service.delete_cover_image(
        db=db,
        current_user=current_user,
        community_id=community_id,
    )


@router.delete(
    "/{community_id}",
    response_model=CommunityResponse,
)
def delete_community(
    community_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return community_service.delete_community(
        db=db,
        current_user=current_user,
        community_id=community_id,
    )