from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.database.models.bank_account_snapshot import BankAccountSnapshot
from app.database.models.bank_connection import BankConnection, BankConnectionStatus
from app.database.models.bank_transaction_snapshot import BankTransactionSnapshot
from app.database.models.financial_analysis import (
    AnalysisConfidence,
    FinancialAnalysis,
    FinancialAnalysisStatus,
    IncomeStability,
)
from app.database.models.financial_monthly_summary import FinancialMonthlySummary
from app.database.models.user import User
from app.services.bank_connection_service import BankConnectionService
from app.services.financial_analysis_rules import (
    ANALYSIS_DISCLAIMER,
    FINANCIAL_ANALYSIS_ALGORITHM_VERSION,
    MonthlySummaryData,
    RawTransaction,
    calculate_analysis_confidence,
    calculate_data_quality_score,
    calculate_income_stability,
    calculate_recommended_rent,
    classify_transactions,
    build_monthly_summaries,
    mean_decimal,
    median_decimal,
    resolve_analysis_period,
)

MIN_MONTHS_REQUIRED = 3
MIN_TRANSACTIONS_FOR_IDENTIFIABLE_INCOME = 1

bank_connection_service = BankConnectionService()


class FinancialAnalysisService:
    def run_analysis(
        self, db: Session, current_user: User
    ) -> FinancialAnalysis:
        connection = (
            db.query(BankConnection)
            .filter(BankConnection.user_id == current_user.id)
            .first()
        )

        if connection is None or connection.status != BankConnectionStatus.CONNECTED:
            raise HTTPException(
                status_code=400,
                detail="Necesitas una conexión bancaria activa para analizar tus datos.",
            )

        in_progress = (
            db.query(FinancialAnalysis)
            .filter(FinancialAnalysis.user_id == current_user.id)
            .filter(FinancialAnalysis.status == FinancialAnalysisStatus.ANALYZING)
            .first()
        )
        if in_progress is not None:
            raise HTTPException(
                status_code=409,
                detail="Ya hay un análisis en curso. Espera a que termine.",
            )

        analysis = FinancialAnalysis(
            user_id=current_user.id,
            bank_connection_id=connection.id,
            status=FinancialAnalysisStatus.ANALYZING,
            algorithm_version=FINANCIAL_ANALYSIS_ALGORITHM_VERSION,
        )
        db.add(analysis)

        try:
            db.commit()
            db.refresh(analysis)
        except Exception:
            db.rollback()
            raise

        try:
            self._compute(db, analysis, connection)
            db.commit()
            db.refresh(analysis)
        except Exception:
            db.rollback()
            analysis.status = FinancialAnalysisStatus.FAILED
            analysis.failure_reason = "No se pudo completar el análisis. Inténtalo de nuevo."
            db.commit()
            raise HTTPException(
                status_code=500,
                detail="No se pudo completar el análisis. Inténtalo de nuevo.",
            )

        return analysis

    def refresh_analysis(
        self, db: Session, current_user: User
    ) -> FinancialAnalysis:
        connection = (
            db.query(BankConnection)
            .filter(BankConnection.user_id == current_user.id)
            .first()
        )

        if connection is None:
            raise HTTPException(
                status_code=400,
                detail="Necesitas una conexión bancaria activa para analizar tus datos.",
            )

        bank_connection_service.sync(db, current_user, str(connection.id))

        previous = (
            db.query(FinancialAnalysis)
            .filter(FinancialAnalysis.user_id == current_user.id)
            .filter(
                FinancialAnalysis.status.in_(
                    [
                        FinancialAnalysisStatus.COMPLETED,
                        FinancialAnalysisStatus.INSUFFICIENT_DATA,
                    ]
                )
            )
            .all()
        )
        for old in previous:
            old.status = FinancialAnalysisStatus.OUTDATED

        try:
            db.commit()
        except Exception:
            db.rollback()
            raise

        return self.run_analysis(db, current_user)

    def get_latest(
        self, db: Session, current_user: User
    ) -> FinancialAnalysis | None:
        return (
            db.query(FinancialAnalysis)
            .filter(FinancialAnalysis.user_id == current_user.id)
            .order_by(FinancialAnalysis.created_at.desc())
            .first()
        )

    def get_latest_monthly(
        self, db: Session, current_user: User
    ) -> list[FinancialMonthlySummary]:
        latest = self.get_latest(db, current_user)
        if latest is None:
            return []

        return (
            db.query(FinancialMonthlySummary)
            .filter(FinancialMonthlySummary.financial_analysis_id == latest.id)
            .order_by(FinancialMonthlySummary.year, FinancialMonthlySummary.month)
            .all()
        )

    def _compute(
        self,
        db: Session,
        analysis: FinancialAnalysis,
        connection: BankConnection,
    ) -> None:
        today = datetime.now(timezone.utc).date()
        period_start, period_end, _window_months = resolve_analysis_period(today)

        snapshots = (
            db.query(BankTransactionSnapshot)
            .filter(BankTransactionSnapshot.bank_connection_id == connection.id)
            .filter(BankTransactionSnapshot.is_pending.is_(False))
            .filter(BankTransactionSnapshot.occurred_at >= period_start)
            .filter(BankTransactionSnapshot.occurred_at < period_end + timedelta(days=1))
            .all()
        )

        accounts_count = (
            db.query(BankAccountSnapshot)
            .filter(BankAccountSnapshot.bank_connection_id == connection.id)
            .count()
        )

        raw_transactions = [
            RawTransaction(
                id=str(s.id),
                external_account_id=s.external_account_id,
                amount=s.amount,
                description=s.description,
                transaction_type=s.transaction_type,
                category=s.category,
                occurred_at=s.occurred_at,
                is_pending=s.is_pending,
            )
            for s in snapshots
        ]

        months_with_data = sorted(
            {(t.occurred_at.year, t.occurred_at.month) for t in raw_transactions}
        )
        months_analyzed = len(months_with_data)

        analysis.analysis_period_start = period_start
        analysis.analysis_period_end = period_end
        analysis.months_analyzed = months_analyzed
        analysis.accounts_analyzed = accounts_count
        analysis.transactions_analyzed = len(raw_transactions)
        analysis.calculated_at = datetime.now(timezone.utc)

        if months_analyzed < MIN_MONTHS_REQUIRED:
            analysis.status = FinancialAnalysisStatus.INSUFFICIENT_DATA
            analysis.failure_reason = (
                f"Solo hay {months_analyzed} mes(es) completos con movimientos "
                "en el periodo analizado. Se necesitan al menos "
                f"{MIN_MONTHS_REQUIRED} para un análisis fiable."
            )
            analysis.result_summary = analysis.failure_reason + " " + ANALYSIS_DISCLAIMER
            self._save_monthly_summaries(db, analysis, [])
            return

        classified = classify_transactions(raw_transactions)
        monthly_summaries = build_monthly_summaries(classified, months_with_data)

        income_values = [m.total_income for m in monthly_summaries]
        recurring_values = [m.recurring_income for m in monthly_summaries]
        fixed_values = [m.total_fixed_expenses for m in monthly_summaries]
        variable_values = [m.total_variable_expenses for m in monthly_summaries]
        outflow_values = [m.total_outflows for m in monthly_summaries]
        margin_values = [m.net_margin for m in monthly_summaries]

        average_monthly_income = mean_decimal(income_values)
        median_monthly_income = median_decimal(income_values)
        recurring_monthly_income = mean_decimal(recurring_values)
        average_monthly_fixed_expenses = mean_decimal(fixed_values)
        average_monthly_variable_expenses = mean_decimal(variable_values)
        average_monthly_outflows = mean_decimal(outflow_values)
        average_monthly_net_margin = mean_decimal(margin_values)

        unknown_count = sum(
            1
            for c in classified
            if c.classification in ("UNKNOWN_INFLOW", "UNKNOWN_OUTFLOW")
        )
        unknown_ratio = (
            Decimal(unknown_count) / Decimal(len(classified))
            if classified
            else Decimal("0")
        )
        has_identifiable_income = average_monthly_income > 0

        months_with_recurring = sum(
            1 for m in monthly_summaries if m.recurring_income > 0
        )
        months_with_recurring_ratio = (
            Decimal(months_with_recurring) / Decimal(months_analyzed)
            if months_analyzed
            else Decimal("0")
        )

        income_stability = calculate_income_stability(
            monthly_summaries, months_analyzed
        )
        analysis_confidence = calculate_analysis_confidence(
            months_analyzed=months_analyzed,
            transactions_analyzed=len(raw_transactions),
            unknown_ratio=unknown_ratio,
            has_identifiable_income=has_identifiable_income,
        )
        recommended_monthly_rent = calculate_recommended_rent(
            recurring_monthly_income=recurring_monthly_income,
            median_monthly_income=median_monthly_income,
            average_monthly_net_margin=average_monthly_net_margin,
            confidence=analysis_confidence,
            income_stability=income_stability,
        )
        data_quality_score = calculate_data_quality_score(
            months_analyzed=months_analyzed,
            target_months=6,
            unknown_ratio=unknown_ratio,
            months_with_recurring_ratio=months_with_recurring_ratio,
        )

        analysis.status = FinancialAnalysisStatus.COMPLETED
        analysis.average_monthly_income = average_monthly_income
        analysis.median_monthly_income = median_monthly_income
        analysis.recurring_monthly_income = recurring_monthly_income
        analysis.average_monthly_fixed_expenses = average_monthly_fixed_expenses
        analysis.average_monthly_variable_expenses = average_monthly_variable_expenses
        analysis.average_monthly_outflows = average_monthly_outflows
        analysis.average_monthly_net_margin = average_monthly_net_margin
        # No hay histórico de saldos (solo una foto por sincronización):
        # no se inventa un promedio a partir del saldo actual.
        analysis.average_balance = None
        analysis.minimum_balance = None
        analysis.months_with_negative_balance = 0
        analysis.income_stability = income_stability
        analysis.analysis_confidence = analysis_confidence
        analysis.recommended_monthly_rent = recommended_monthly_rent
        analysis.data_quality_score = data_quality_score
        analysis.result_summary = self._build_result_summary(
            recurring_monthly_income=recurring_monthly_income,
            income_stability=income_stability,
            analysis_confidence=analysis_confidence,
            recommended_monthly_rent=recommended_monthly_rent,
        )

        self._save_monthly_summaries(db, analysis, monthly_summaries)

    def _save_monthly_summaries(
        self,
        db: Session,
        analysis: FinancialAnalysis,
        monthly_summaries: list[MonthlySummaryData],
    ) -> None:
        db.query(FinancialMonthlySummary).filter(
            FinancialMonthlySummary.financial_analysis_id == analysis.id
        ).delete()

        for m in monthly_summaries:
            db.add(
                FinancialMonthlySummary(
                    financial_analysis_id=analysis.id,
                    year=m.year,
                    month=m.month,
                    total_income=m.total_income,
                    recurring_income=m.recurring_income,
                    total_fixed_expenses=m.total_fixed_expenses,
                    total_variable_expenses=m.total_variable_expenses,
                    total_outflows=m.total_outflows,
                    net_margin=m.net_margin,
                    closing_balance=None,
                    income_sources_count=m.income_sources_count,
                )
            )

    def _build_result_summary(
        self,
        *,
        recurring_monthly_income: Decimal,
        income_stability: IncomeStability,
        analysis_confidence: AnalysisConfidence,
        recommended_monthly_rent: Decimal | None,
    ) -> str:
        stability_text = {
            IncomeStability.HIGH: "alta",
            IncomeStability.MEDIUM: "media",
            IncomeStability.LOW: "baja",
        }[income_stability]
        confidence_text = {
            AnalysisConfidence.HIGH: "alta",
            AnalysisConfidence.MEDIUM: "media",
            AnalysisConfidence.LOW: "baja",
        }[analysis_confidence]

        if recommended_monthly_rent is not None:
            rent_text = f"una capacidad orientativa de hasta {recommended_monthly_rent} € al mes"
        else:
            rent_text = "datos insuficientes para una estimación de capacidad orientativa"

        summary = (
            f"Ingresos recurrentes detectados: estabilidad {stability_text}. "
            f"Confianza del análisis: {confidence_text}. "
            f"Resultado: {rent_text}. "
        )
        return summary + ANALYSIS_DISCLAIMER
