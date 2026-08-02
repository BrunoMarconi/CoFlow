from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.database.models.financial_analysis import (
    AnalysisConfidence,
    FinancialAnalysisStatus,
    IncomeStability,
)

# Nunca se incluyen movimientos individuales, descripciones, categorías,
# comercios ni data_quality_score en ningún schema de respuesta.


class FinancialAnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: FinancialAnalysisStatus
    algorithm_version: str

    analysis_period_start: date | None = None
    analysis_period_end: date | None = None
    months_analyzed: int
    accounts_analyzed: int
    transactions_analyzed: int

    average_monthly_income: Decimal | None = None
    median_monthly_income: Decimal | None = None
    recurring_monthly_income: Decimal | None = None
    average_monthly_fixed_expenses: Decimal | None = None
    average_monthly_variable_expenses: Decimal | None = None
    average_monthly_outflows: Decimal | None = None
    average_monthly_net_margin: Decimal | None = None

    average_balance: Decimal | None = None
    minimum_balance: Decimal | None = None
    months_with_negative_balance: int

    income_stability: IncomeStability | None = None
    analysis_confidence: AnalysisConfidence | None = None
    recommended_monthly_rent: Decimal | None = None

    result_summary: str
    failure_reason: str | None = None

    calculated_at: datetime | None = None
    created_at: datetime


class FinancialMonthlySummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    year: int
    month: int
    total_income: Decimal
    recurring_income: Decimal
    total_fixed_expenses: Decimal
    total_variable_expenses: Decimal
    total_outflows: Decimal
    net_margin: Decimal
    closing_balance: Decimal | None = None
    income_sources_count: int
