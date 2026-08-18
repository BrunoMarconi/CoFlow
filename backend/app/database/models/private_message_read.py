import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class PrivateMessageRead(Base):
    """Hasta qué mensaje ha leído cada participante de una conversación
    privada — una fila por (conexión, usuario). Mismo criterio que
    CommunityMessageRead."""

    __tablename__ = "private_message_reads"
    __table_args__ = (
        UniqueConstraint("connection_id", "user_id", name="uq_private_message_reads_connection_user"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    connection_id: Mapped[int] = mapped_column(
        ForeignKey("user_connections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    last_read_message_id: Mapped[int] = mapped_column(Integer, nullable=False)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
