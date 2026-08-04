import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class EmailVerificationToken(Base):
    """Token de un solo uso para confirmar el email de un usuario.

    El token en claro nunca se guarda: solo su hash sha256
    (`token_hash`). `requested_ip_hash` es el hash de la IP que pidió el
    envío (registro o reenvío), usado únicamente para limitar abuso —
    tampoco se guarda la IP en claro.
    """

    __tablename__ = "email_verification_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    token_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        unique=True,
        index=True,
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    requested_ip_hash: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )
    resend_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
