from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_verified_email
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.private_message import (
    PrivateConversationSummaryResponse,
    PrivateMessageCreate,
    PrivateMessageResponse,
)
from app.schemas.user_connection import (
    UserConnectionOverviewResponse,
    UserConnectionRequestsResponse,
    UserConnectionResponse,
)
from app.services.private_message_service import PrivateMessageService
from app.services.user_connection_service import UserConnectionService

router = APIRouter()

user_connection_service = UserConnectionService()
private_message_service = PrivateMessageService()


@router.get(
    "/inbox",
    response_model=list[PrivateConversationSummaryResponse],
)
def list_private_conversation_summaries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return private_message_service.get_conversation_summaries(
        db=db,
        current_user=current_user,
    )


@router.get(
    "",
    response_model=list[UserConnectionResponse],
)
def list_connections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_connection_service.list_connections(
        db=db,
        current_user=current_user,
    )


@router.get(
    "/overview",
    response_model=UserConnectionOverviewResponse,
)
def get_connection_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_connection_service.get_overview(
        db=db,
        current_user=current_user,
    )


@router.get(
    "/requests",
    response_model=UserConnectionRequestsResponse,
)
def list_connection_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return UserConnectionRequestsResponse(
        received=user_connection_service.list_received_requests(
            db=db,
            current_user=current_user,
        ),
        sent=user_connection_service.list_sent_requests(
            db=db,
            current_user=current_user,
        ),
    )


@router.post(
    "/{connection_id}/accept",
    response_model=UserConnectionResponse,
)
def accept_connection(
    connection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_connection_service.accept_connection(
        db=db,
        current_user=current_user,
        connection_id=connection_id,
    )


@router.post(
    "/{connection_id}/reject",
    response_model=UserConnectionResponse,
)
def reject_connection(
    connection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_connection_service.reject_connection(
        db=db,
        current_user=current_user,
        connection_id=connection_id,
    )


@router.post(
    "/{connection_id}/cancel",
    response_model=UserConnectionResponse,
)
def cancel_connection(
    connection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_connection_service.cancel_connection(
        db=db,
        current_user=current_user,
        connection_id=connection_id,
    )


@router.delete(
    "/{connection_id}",
)
def delete_connection(
    connection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_connection_service.delete_connection(
        db=db,
        current_user=current_user,
        connection_id=connection_id,
    )

    return {"message": "Connection removed"}


@router.get(
    "/{connection_id}/messages",
    response_model=list[PrivateMessageResponse],
)
def list_private_messages(
    connection_id: int,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return private_message_service.get_messages(
        db=db,
        current_user=current_user,
        connection_id=connection_id,
        skip=skip,
        limit=limit,
    )


@router.post(
    "/{connection_id}/messages",
    response_model=PrivateMessageResponse,
)
def create_private_message(
    connection_id: int,
    data: PrivateMessageCreate,
    current_user: User = Depends(require_verified_email),
    db: Session = Depends(get_db),
):
    return private_message_service.create_message(
        db=db,
        current_user=current_user,
        connection_id=connection_id,
        data=data,
    )


@router.delete(
    "/{connection_id}/messages/{message_id}",
    status_code=204,
)
def delete_private_message(
    connection_id: int,
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    private_message_service.delete_message(
        db=db,
        current_user=current_user,
        connection_id=connection_id,
        message_id=message_id,
    )


@router.post(
    "/{connection_id}/messages/{message_id}/like",
    response_model=PrivateMessageResponse,
)
def toggle_private_message_like(
    connection_id: int,
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return private_message_service.toggle_like(
        db=db,
        current_user=current_user,
        connection_id=connection_id,
        message_id=message_id,
    )
