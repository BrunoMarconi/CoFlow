import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class BankConnectionStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONNECTED = "CONNECTED"
    EXPIRED = "EXPIRED"
    REVOKED = "REVOKED"
    FAILED = "FAILED"


class BankConnection(Base):
    """Conexión de un usuario con un banco a través de TrueLayer.

    access_token_encrypted/refresh_token_encrypted contienen el texto
    cifrado con Fernet (app/core/token_encryption.py), nunca el token en
    claro. No se exponen en ningún schema de respuesta.
    """

    __tablename__ = "bank_connections"

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

    provider_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    provider_id: Mapped[str | None] = mapped_column(String(150), nullable=True)

    status: Mapped[BankConnectionStatus] = mapped_column(
        Enum(BankConnectionStatus, name="bank_connection_status"),
        nullable=False,
        default=BankConnectionStatus.PENDING,
    )

    # TrueLayer no siempre expone un id de conexión estable en Data API
    # v1; se guarda si la respuesta lo trae (p.ej. via /data/v1/me).
    truelayer_connection_id: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    access_token_encrypted: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )
    refresh_token_encrypted: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )
    token_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    consent_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    connected_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    disconnected_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    last_synced_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
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

    accounts: Mapped[list["BankAccountSnapshot"]] = relationship(
        "BankAccountSnapshot",
        back_populates="bank_connection",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    transactions: Mapped[list["BankTransactionSnapshot"]] = relationship(
        "BankTransactionSnapshot",
        back_populates="bank_connection",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
