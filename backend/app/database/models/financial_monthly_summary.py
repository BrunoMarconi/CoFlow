import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class FinancialMonthlySummary(Base):
    """Resumen agregado de un mes concreto de un FinancialAnalysis.

    Nunca contiene movimientos individuales ni descripciones.
    """

    __tablename__ = "financial_monthly_summaries"
    __table_args__ = (
        UniqueConstraint(
            "financial_analysis_id",
            "year",
            "month",
            name="uq_financial_monthly_summary_analysis_year_month",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    financial_analysis_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_analyses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)

    total_income: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    recurring_income: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total_fixed_expenses: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False
    )
    total_variable_expenses: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False
    )
    total_outflows: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    net_margin: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    closing_balance: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    income_sources_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    financial_analysis: Mapped["FinancialAnalysis"] = relationship(
        "FinancialAnalysis",
        back_populates="monthly_summaries",
    )
