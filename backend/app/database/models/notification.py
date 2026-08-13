import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class NotificationType(str, enum.Enum):
    COMMUNITY_APPLICATION_RECEIVED = "COMMUNITY_APPLICATION_RECEIVED"
    COMMUNITY_APPLICATION_ACCEPTED = "COMMUNITY_APPLICATION_ACCEPTED"
    COMMUNITY_APPLICATION_REJECTED = "COMMUNITY_APPLICATION_REJECTED"
    COMMUNITY_INVITATION_ACCEPTED = "COMMUNITY_INVITATION_ACCEPTED"
    COMMUNITY_INVITATION_RECEIVED = "COMMUNITY_INVITATION_RECEIVED"
    CONNECTION_REQUEST_RECEIVED = "CONNECTION_REQUEST_RECEIVED"
    CONNECTION_REQUEST_ACCEPTED = "CONNECTION_REQUEST_ACCEPTED"
    COMMUNITY_MEMBER_JOINED = "COMMUNITY_MEMBER_JOINED"
    COMMUNITY_MEMBER_LEFT = "COMMUNITY_MEMBER_LEFT"
    COMMUNITY_MEMBER_REMOVED = "COMMUNITY_MEMBER_REMOVED"
    COMMUNITY_OWNERSHIP_TRANSFERRED = "COMMUNITY_OWNERSHIP_TRANSFERRED"
    PRIVATE_MESSAGE_RECEIVED = "PRIVATE_MESSAGE_RECEIVED"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    type: Mapped[NotificationType] = mapped_column(
        Enum(
            NotificationType,
            name="notification_type",
        ),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    link: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    is_read: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
