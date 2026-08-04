from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import ENABLE_FINANCIAL_DEBUG, ENVIRONMENT, TRUELAYER_ENVIRONMENT
from app.core.dependencies import get_current_user, require_verified_email
from app.database.session import get_db
from app.database.models.user import User
from app.schemas.financial_analysis import (
    FinancialAnalysisResponse,
    FinancialMonthlySummaryResponse,
    RecurringIncomeDebugResponse,
)
from app.services.financial_analysis_service import FinancialAnalysisService

router = APIRouter()

financial_analysis_service = FinancialAnalysisService()


def _is_sandbox() -> bool:
    return TRUELAYER_ENVIRONMENT != "live"


def _to_response(analysis) -> FinancialAnalysisResponse:
    response = FinancialAnalysisResponse.model_validate(analysis)
    response.is_sandbox = _is_sandbox()
    return response


def require_financial_debug_enabled() -> None:
    """Los endpoints /debug/* solo existen fuera de producción, salvo que
    se active ENABLE_FINANCIAL_DEBUG explícitamente. Devuelve 404 (no
    403) para no revelar ni siquiera que el endpoint existe."""
    debug_enabled = ENVIRONMENT != "production" or ENABLE_FINANCIAL_DEBUG
    if not debug_enabled:
        raise HTTPException(status_code=404, detail="Not Found")


@router.post("/run", response_model=FinancialAnalysisResponse)
def run_financial_analysis(
    current_user: User = Depends(require_verified_email),
    db: Session = Depends(get_db),
):
    analysis = financial_analysis_service.run_analysis(db=db, current_user=current_user)
    return _to_response(analysis)


@router.post("/refresh", response_model=FinancialAnalysisResponse)
def refresh_financial_analysis(
    current_user: User = Depends(require_verified_email),
    db: Session = Depends(get_db),
):
    analysis = financial_analysis_service.refresh_analysis(
        db=db, current_user=current_user
    )
    return _to_response(analysis)


@router.get("/me", response_model=FinancialAnalysisResponse)
def get_my_financial_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    analysis = financial_analysis_service.get_latest(db=db, current_user=current_user)

    if analysis is None:
        raise HTTPException(status_code=404, detail="Todavía no hay ningún análisis.")

    return _to_response(analysis)


@router.get("/me/monthly", response_model=list[FinancialMonthlySummaryResponse])
def get_my_financial_analysis_monthly(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return financial_analysis_service.get_latest_monthly(
        db=db, current_user=current_user
    )


@router.get(
    "/debug/recurring-income",
    response_model=RecurringIncomeDebugResponse,
    dependencies=[Depends(require_financial_debug_enabled)],
)
def debug_recurring_income(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Solo desarrollo. Nunca devuelve tokens, IBAN, números de cuenta,
    ids completos ni descripciones — solo agregados anonimizados por
    grupo de recurrencia, para auditar por qué recurring_monthly_income
    sale como sale."""
    return financial_analysis_service.get_recurring_income_diagnostics(
        db=db, current_user=current_user
    )
