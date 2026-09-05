from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database.models.notification import Notification, NotificationType
from app.database.models.user import User

MAX_LIMIT = 100


def create_notification(
    db: Session,
    user_id: UUID,
    type: NotificationType,
    title: str,
    message: str,
    link: str | None = None,
) -> Notification | None:
    user = db.query(User).filter(User.id == user_id).first()
    preferences = (user.notification_preferences or {}) if user else {}
    category = _notification_category(type)
    if preferences.get("in_app_enabled") is False or preferences.get(category) is False:
        return None
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        link=link,
    )
    db.add(notification)
    return notification


def _notification_category(type: NotificationType) -> str:
    if type == NotificationType.PRIVATE_MESSAGE_RECEIVED:
        return "messages"
    if type in {NotificationType.CONNECTION_REQUEST_RECEIVED, NotificationType.CONNECTION_REQUEST_ACCEPTED}:
        return "connections"
    if "APPLICATION" in type.value or "INVITATION" in type.value:
        return "applications"
    return "communities"


class NotificationService:

    def list_notifications(
        self,
        db: Session,
        current_user: User,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Notification]:
        limit = min(max(limit, 1), MAX_LIMIT)
        skip = max(skip, 0)

        return (
            db.query(Notification)
            .filter(Notification.user_id == current_user.id)
            .order_by(Notification.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_unread_count(
        self,
        db: Session,
        current_user: User,
    ) -> int:
        return (
            db.query(func.count(Notification.id))
            .filter(
                Notification.user_id == current_user.id,
                Notification.is_read.is_(False),
            )
            .scalar()
            or 0
        )

    def get_unread_message_count(
        self,
        db: Session,
        current_user: User,
    ) -> int:
        return (
            db.query(func.count(Notification.id))
            .filter(
                Notification.user_id == current_user.id,
                Notification.type == NotificationType.PRIVATE_MESSAGE_RECEIVED,
                Notification.is_read.is_(False),
            )
            .scalar()
            or 0
        )

    def mark_link_read(
        self,
        db: Session,
        current_user: User,
        link: str,
    ) -> int:
        normalized_link = "/" + link.strip().lstrip("/")
        path = normalized_link.split("?", 1)[0].rstrip("/") or "/"
        marked_count = (
            db.query(Notification)
            .filter(
                Notification.user_id == current_user.id,
                or_(
                    Notification.link == normalized_link,
                    Notification.link == path,
                    Notification.link.like(f"{path}?%"),
                ),
                Notification.is_read.is_(False),
            )
            .update(
                {Notification.is_read: True},
                synchronize_session=False,
            )
        )
        db.commit()
        return int(marked_count)

    def mark_read(
        self,
        db: Session,
        current_user: User,
        notification_id: int,
    ) -> Notification:
        notification = (
            db.query(Notification)
            .filter(
                Notification.id == notification_id,
                Notification.user_id == current_user.id,
            )
            .first()
        )

        if notification is None:
            raise HTTPException(
                status_code=404,
                detail="Notification not found",
            )

        notification.is_read = True
        db.commit()
        db.refresh(notification)
        return notification

    def mark_all_read(
        self,
        db: Session,
        current_user: User,
    ) -> None:
        (
            db.query(Notification)
            .filter(
                Notification.user_id == current_user.id,
                Notification.is_read.is_(False),
            )
            .update(
                {Notification.is_read: True},
                synchronize_session=False,
            )
        )
        db.commit()
