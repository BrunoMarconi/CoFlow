import enum
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class FinancialAnalysisStatus(str, enum.Enum):
    PENDING = "PENDING"
    ANALYZING = "ANALYZING"
    COMPLETED = "COMPLETED"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"
    FAILED = "FAILED"
    OUTDATED = "OUTDATED"


class IncomeStability(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class AnalysisConfidence(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class FinancialAnalysis(Base):
    """Análisis financiero orientativo derivado de los snapshots bancarios.

    Es un resultado agregado, versionado y recalculable — nunca guarda
    movimientos individuales ni una etiqueta de "solvente/insolvente".
    """

    __tablename__ = "financial_analyses"

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
    bank_connection_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bank_connections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    status: Mapped[FinancialAnalysisStatus] = mapped_column(
        Enum(FinancialAnalysisStatus, name="financial_analysis_status"),
        nullable=False,
        default=FinancialAnalysisStatus.PENDING,
    )
    algorithm_version: Mapped[str] = mapped_column(String(20), nullable=False)

    analysis_period_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    analysis_period_end: Mapped[date | None] = mapped_column(Date, nullable=True)
    months_analyzed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    accounts_analyzed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    transactions_analyzed: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )

    average_monthly_income: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    median_monthly_income: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    recurring_monthly_income: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    average_monthly_fixed_expenses: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    average_monthly_variable_expenses: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    average_monthly_outflows: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    average_monthly_net_margin: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )

    average_balance: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    minimum_balance: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    months_with_negative_balance: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )

    income_stability: Mapped[IncomeStability | None] = mapped_column(
        Enum(IncomeStability, name="income_stability"), nullable=True
    )
    analysis_confidence: Mapped[AnalysisConfidence | None] = mapped_column(
        Enum(AnalysisConfidence, name="analysis_confidence"), nullable=True
    )

    recommended_monthly_rent: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )

    # Interno: calidad de los datos de entrada (0-100). Nunca se expone en
    # la API pública ni se usa como score de solvencia (ver sección 12).
    data_quality_score: Mapped[int | None] = mapped_column(Integer, nullable=True)

    result_summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    calculated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
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

    monthly_summaries: Mapped[list["FinancialMonthlySummary"]] = relationship(
        "FinancialMonthlySummary",
        back_populates="financial_analysis",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
