import enum
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base
from app.database.models.financial_analysis import AnalysisConfidence, IncomeStability


class SolvencyPassportStatus(str, enum.Enum):
    ISSUED = "ISSUED"
    EXPIRED = "EXPIRED"
    REVOKED = "REVOKED"


class SolvencyPassport(Base):
    """Snapshot inmutable de un FinancialAnalysis COMPLETED, emitido para
    compartir con propietarios/inmobiliarias.

    Nunca se recalcula al leerlo: todos los campos se copian del análisis
    en el momento de emitir. No guarda movimientos, descripciones,
    comercios, IBAN, números de cuenta ni tokens bancarios.

    El token público no se persiste en ninguna forma (ni en claro ni
    cifrado ni como hash): se deriva bajo demanda con HMAC a partir de
    `share_nonce` + `share_token_version` + PASSPORT_SHARE_SECRET (ver
    app/core/passport_tokens.py). Regenerar el enlace rota `share_nonce`.
    """

    __tablename__ = "solvency_passports"

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
    financial_analysis_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_analyses.id"),
        nullable=False,
        index=True,
    )

    public_id: Mapped[str] = mapped_column(String(32), nullable=False, unique=True)

    share_nonce: Mapped[str] = mapped_column(String(64), nullable=False)
    share_token_version: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1
    )

    status: Mapped[SolvencyPassportStatus] = mapped_column(
        Enum(SolvencyPassportStatus, name="solvency_passport_status"),
        nullable=False,
        default=SolvencyPassportStatus.ISSUED,
    )
    algorithm_version: Mapped[str] = mapped_column(String(20), nullable=False)

    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    is_sandbox: Mapped[bool] = mapped_column(nullable=False, default=True)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="EUR")

    analysis_period_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    analysis_period_end: Mapped[date | None] = mapped_column(Date, nullable=True)
    months_analyzed: Mapped[int] = mapped_column(Integer, nullable=False)

    recurring_monthly_income: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    average_fixed_expenses: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    average_variable_expenses: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    average_monthly_margin: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    recommended_rent_capacity: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )

    income_stability: Mapped[IncomeStability] = mapped_column(
        Enum(IncomeStability, name="income_stability"),
        nullable=False,
    )
    confidence_level: Mapped[AnalysisConfidence] = mapped_column(
        Enum(AnalysisConfidence, name="analysis_confidence"),
        nullable=False,
    )

    # Snapshot de "Nombre A." calculado al emitir, para que el endpoint
    # público nunca necesite consultar la tabla users.
    holder_initials: Mapped[str] = mapped_column(String(10), nullable=False)

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
