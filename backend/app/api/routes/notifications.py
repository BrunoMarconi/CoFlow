from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.notification import (
    NotificationLinkReadRequest,
    NotificationLinkReadResponse,
    NotificationResponse,
    UnreadNotificationCountResponse,
)
from app.services.notification_service import NotificationService

router = APIRouter()

notification_service = NotificationService()


@router.post(
    "/read-by-link",
    response_model=NotificationLinkReadResponse,
)
def mark_notifications_for_link_read(
    data: NotificationLinkReadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    marked_count = notification_service.mark_link_read(
        db=db,
        current_user=current_user,
        link=data.link,
    )

    return NotificationLinkReadResponse(
        marked_count=marked_count,
        unread_count=notification_service.get_unread_count(
            db=db,
            current_user=current_user,
        ),
    )


@router.get(
    "",
    response_model=list[NotificationResponse],
)
def list_notifications(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return notification_service.list_notifications(
        db=db,
        current_user=current_user,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/unread-count",
    response_model=UnreadNotificationCountResponse,
)
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return UnreadNotificationCountResponse(
        unread_count=notification_service.get_unread_count(
            db=db,
            current_user=current_user,
        )
    )


@router.post(
    "/read-all",
    response_model=UnreadNotificationCountResponse,
)
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification_service.mark_all_read(
        db=db,
        current_user=current_user,
    )

    return UnreadNotificationCountResponse(unread_count=0)


@router.post(
    "/{notification_id}/read",
    response_model=NotificationResponse,
)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return notification_service.mark_read(
        db=db,
        current_user=current_user,
        notification_id=notification_id,
    )
