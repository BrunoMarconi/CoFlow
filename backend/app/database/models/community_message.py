import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class CommunityMessage(Base):
    __tablename__ = "community_messages"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    reply_to_id: Mapped[int | None] = mapped_column(
        ForeignKey("community_messages.id", ondelete="SET NULL"),
        nullable=True,
    )

    # IDs (como texto) de quienes le han dado "me gusta" — una lista
    # simple basta para el volumen de un chat de comunidad; no hace
    # falta una tabla aparte por like.
    liked_by_user_ids: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    community_id: Mapped[int] = mapped_column(
        ForeignKey(
            "communities.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    sender_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # Presente solo en mensajes con foto — el pie de foto (si lo hay)
    # va en `content` igualmente (puede quedar como cadena vacía).
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

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

    community: Mapped["Community"] = relationship(
        "Community",
        back_populates="messages",
    )

    sender: Mapped["User"] = relationship(
        "User",
        back_populates="community_messages",
    )

    reply_to: Mapped["CommunityMessage | None"] = relationship(
        "CommunityMessage",
        remote_side=[id],
        foreign_keys=[reply_to_id],
    )
