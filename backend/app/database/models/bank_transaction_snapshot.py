import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class BankTransactionSnapshot(Base):
    """Foto mínima de un movimiento bancario recuperado de TrueLayer."""

    __tablename__ = "bank_transaction_snapshots"
    __table_args__ = (
        UniqueConstraint(
            "bank_connection_id",
            "external_transaction_id",
            name="uq_bank_transaction_snapshot_connection_external_id",
        ),
        Index(
            "ix_bank_transaction_snapshots_connection_occurred_at",
            "bank_connection_id",
            "occurred_at",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    bank_connection_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bank_connections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    external_account_id: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        index=True,
    )
    external_transaction_id: Mapped[str] = mapped_column(String(255), nullable=False)

    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)

    # Sanitizada: recortada a una longitud razonable, sin HTML/control chars.
    description: Mapped[str] = mapped_column(String(500), nullable=False)

    transaction_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)

    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    is_pending: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    bank_connection: Mapped["BankConnection"] = relationship(
        "BankConnection",
        back_populates="transactions",
    )
