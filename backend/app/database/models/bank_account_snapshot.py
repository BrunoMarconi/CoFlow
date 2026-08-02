import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class BankAccountSnapshot(Base):
    """Foto mínima de una cuenta bancaria en el momento de la sincronización.

    No guarda número de cuenta ni IBAN completos: solo el id externo de
    TrueLayer, un nombre para mostrar y los saldos.
    """

    __tablename__ = "bank_account_snapshots"
    __table_args__ = (
        UniqueConstraint(
            "bank_connection_id",
            "external_account_id",
            name="uq_bank_account_snapshot_connection_external_id",
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

    external_account_id: Mapped[str] = mapped_column(String(150), nullable=False)
    account_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    display_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)

    current_balance: Mapped[Decimal | None] = mapped_column(
        Numeric(14, 2),
        nullable=True,
    )
    available_balance: Mapped[Decimal | None] = mapped_column(
        Numeric(14, 2),
        nullable=True,
    )

    collected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    bank_connection: Mapped["BankConnection"] = relationship(
        "BankConnection",
        back_populates="accounts",
    )
