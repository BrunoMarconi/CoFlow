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

    # No es un campo del modelo: se rellena en la ruta a partir de
    # TRUELAYER_ENVIRONMENT para que el frontend pueda avisar de que los
    # datos son de sandbox, no una evaluación financiera real.
    is_sandbox: bool = False


class RecurringGroupDiagnosticResponse(BaseModel):
    """Solo desarrollo. Todo aquí es anonimizado/agregado — nunca ids
    completos, tokens, IBAN, números de cuenta ni descripciones."""

    model_config = ConfigDict(from_attributes=True)

    group_alias: str
    classification: str
    confidence: str
    months: list[str]
    transaction_count: int
    average_amount: Decimal
    minimum_amount: Decimal
    maximum_amount: Decimal
    monthly_contribution: Decimal
    account_alias: str
    looks_like_internal_transfer: bool
    duplicate_in_month_count: int
    reason: str


class ConfidenceBreakdownResponse(BaseModel):
    months_available: int
    classified_ratio: Decimal
    ambiguous_ratio: Decimal
    recurring_income_coverage: Decimal
    historical_balances_available: bool
    internal_transfers_detected: int
    data_quality_score: int
    resulting_confidence: AnalysisConfidence


class RecurringIncomeDebugResponse(BaseModel):
    period_start: date
    period_end: date
    months_with_data: list[str]
    recurring_monthly_income: Decimal
    groups: list[RecurringGroupDiagnosticResponse]
    confidence_breakdown: ConfidenceBreakdownResponse


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
