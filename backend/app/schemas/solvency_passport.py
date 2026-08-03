from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.database.models.financial_analysis import AnalysisConfidence, IncomeStability
from app.database.models.solvency_passport import SolvencyPassportStatus

LEGAL_NOTICE = (
    "Este documento contiene una estimación orientativa basada en datos "
    "autorizados. No constituye un aval, una garantía de pago, una "
    "aprobación de alquiler ni una decisión automática."
)
SANDBOX_NOTICE = (
    "Documento de prueba generado con datos bancarios ficticios. No "
    "representa una evaluación financiera real."
)


class SolvencyPassportResponse(BaseModel):
    """Para el propietario autenticado. Incluye `share_url` (recalculada
    en cada respuesta, nunca persistida) pero ningún dato bancario."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    public_id: str
    status: SolvencyPassportStatus
    algorithm_version: str
    issued_at: datetime
    expires_at: datetime
    revoked_at: datetime | None
    is_sandbox: bool
    currency: str
    analysis_period_start: date | None
    analysis_period_end: date | None
    months_analyzed: int
    recurring_monthly_income: Decimal | None
    average_fixed_expenses: Decimal | None
    average_variable_expenses: Decimal | None
    average_monthly_margin: Decimal | None
    recommended_rent_capacity: Decimal | None
    income_stability: IncomeStability
    confidence_level: AnalysisConfidence
    created_at: datetime

    # No es un campo del modelo: se rellena en la ruta.
    share_url: str = ""


class PublicSolvencyPassportResponse(BaseModel):
    """Para el endpoint público. Nunca incluye ids internos, user_id,
    financial_analysis_id ni nada de la tabla users."""

    public_id: str
    status: SolvencyPassportStatus
    holder_initials: str
    issued_at: datetime
    expires_at: datetime
    is_sandbox: bool
    currency: str
    analysis_period_start: date | None
    analysis_period_end: date | None
    months_analyzed: int
    recommended_rent_capacity: Decimal | None
    income_stability: IncomeStability
    confidence_level: AnalysisConfidence
    algorithm_version: str
    legal_notice: str = LEGAL_NOTICE
    sandbox_notice: str | None = None
