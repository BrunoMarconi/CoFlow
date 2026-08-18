from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_verified_email
from app.database.models.community import CommunityProfileType
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.community import (
    CommunityCreate,
    CommunityOwnershipTransfer,
    CommunityResponse,
    CommunityUpdate,
)
from app.schemas.community_message import (
    CommunityMarkReadRequest,
    CommunityMessageCreate,
    CommunityMessageResponse,
    CommunityOwnReadStateResponse,
    CommunityReadReceiptsResponse,
    CommunityTypingUsersResponse,
)
from app.schemas.community_rent_split import (
    CommunityRentSplitResponse,
    CommunityRentSplitUpdate,
)
from app.schemas.community_invitation import (
    CommunityInvitationCreate,
    CommunityInvitationResponse,
)
from app.schemas.community_application import (
    CommunityApplicationCreate,
    CommunityApplicationResponse,
)
from app.schemas.saved_profile import SavedProfileActionResponse
from app.services.community_service import CommunityService
from app.services.saved_community_service import SavedCommunityService
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
saved_community_service = SavedCommunityService()
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
    "/{community_id}/save",
    response_model=SavedProfileActionResponse,
)
def save_community(
    community_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    saved = saved_community_service.save_community(
        db=db,
        current_user=current_user,
        community_id=community_id,
    )

    return SavedProfileActionResponse(saved=saved)


@router.delete(
    "/{community_id}/save",
    response_model=SavedProfileActionResponse,
)
def unsave_community(
    community_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    saved = saved_community_service.unsave_community(
        db=db,
        current_user=current_user,
        community_id=community_id,
    )

    return SavedProfileActionResponse(saved=saved)


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


@router.delete(
    "/{community_id}/members/{member_user_id}",
    response_model=CommunityResponse,
)
def remove_community_member(
    community_id: int,
    member_user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return community_service.remove_member(
        db=db,
        current_user=current_user,
        community_id=community_id,
        member_user_id=member_user_id,
    )


@router.post(
    "/{community_id}/transfer-ownership",
    response_model=CommunityResponse,
)
def transfer_community_ownership(
    community_id: int,
    data: CommunityOwnershipTransfer,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return community_service.transfer_ownership(
        db=db,
        current_user=current_user,
        community_id=community_id,
        new_owner_user_id=data.new_owner_user_id,
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


@router.delete(
    "/{community_id}/messages/{message_id}",
    status_code=204,
)
def delete_community_message(
    community_id: int,
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    community_message_service.delete_message(
        db=db,
        community_id=community_id,
        message_id=message_id,
        current_user=current_user,
    )


@router.post(
    "/{community_id}/messages/{message_id}/like",
    response_model=CommunityMessageResponse,
)
def toggle_community_message_like(
    community_id: int,
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return community_message_service.toggle_like(
        db=db,
        community_id=community_id,
        message_id=message_id,
        current_user=current_user,
    )


@router.post(
    "/{community_id}/messages/image",
    response_model=CommunityMessageResponse,
)
async def create_community_image_message(
    community_id: int,
    file: UploadFile = File(...),
    content: str = Form(default=""),
    current_user: User = Depends(require_verified_email),
    db: Session = Depends(get_db),
):
    return await community_message_service.create_image_message(
        db=db,
        community_id=community_id,
        current_user=current_user,
        file=file,
        content=content,
    )


@router.post("/{community_id}/messages/read")
def mark_community_messages_read(
    community_id: int,
    data: CommunityMarkReadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    community_message_service.mark_read(
        db=db,
        community_id=community_id,
        current_user=current_user,
        last_read_message_id=data.last_read_message_id,
    )
    return {"ok": True}


@router.get(
    "/{community_id}/messages/read/me",
    response_model=CommunityOwnReadStateResponse,
)
def get_my_community_read_state(
    community_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return CommunityOwnReadStateResponse(
        last_read_message_id=community_message_service.get_own_read_state(
            db=db, community_id=community_id, current_user=current_user,
        )
    )


@router.get(
    "/{community_id}/messages/read",
    response_model=CommunityReadReceiptsResponse,
)
def get_community_read_receipts(
    community_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return CommunityReadReceiptsResponse(
        read_by=community_message_service.get_read_receipts(
            db=db, community_id=community_id, current_user=current_user,
        )
    )


@router.post("/{community_id}/typing")
def send_community_typing(
    community_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    community_message_service.mark_typing(db, community_id, current_user)
    return {"ok": True}


@router.get(
    "/{community_id}/typing",
    response_model=CommunityTypingUsersResponse,
)
def get_community_typing(
    community_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return CommunityTypingUsersResponse(
        typing_names=community_message_service.get_typing_names(
            db, community_id, current_user
        )
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
    data: CommunityInvitationCreate | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return community_invitation_service.create_invitation(
        db=db,
        current_user=current_user,
        community_id=community_id,
        data=data or CommunityInvitationCreate(),
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
