import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class PrivateMessage(Base):
    __tablename__ = "private_messages"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    reply_to_id: Mapped[int | None] = mapped_column(
        ForeignKey("private_messages.id", ondelete="SET NULL"),
        nullable=True,
    )

    liked_by_user_ids: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    connection_id: Mapped[int] = mapped_column(
        ForeignKey("user_connections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    sender_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    sender: Mapped["User"] = relationship(
        "User",
        foreign_keys=[sender_id],
    )

    reply_to: Mapped["PrivateMessage | None"] = relationship(
        "PrivateMessage",
        remote_side=[id],
        foreign_keys=[reply_to_id],
    )
