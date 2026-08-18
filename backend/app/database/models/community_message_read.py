import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class CommunityMessageRead(Base):
    """Hasta qué mensaje ha leído cada miembro de una comunidad — una
    fila por (comunidad, usuario), se actualiza (upsert) cada vez que
    abre el chat. Permite calcular "leído" (✓✓ azul) sin guardar un
    estado de lectura por cada mensaje individual."""

    __tablename__ = "community_message_reads"
    __table_args__ = (
        UniqueConstraint("community_id", "user_id", name="uq_community_message_reads_community_user"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    community_id: Mapped[int] = mapped_column(
        ForeignKey("communities.id", ondelete="CASCADE"),
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
