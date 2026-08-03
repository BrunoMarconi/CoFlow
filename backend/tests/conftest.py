"""Fixtures de base de datos para tests de servicio.

No existía infraestructura de tests con DB en el proyecto. Esta usa la
misma Postgres local de desarrollo (DATABASE_URL de backend/.env, ya con
las tablas migradas) y aísla cada test con el patrón estándar de
SQLAlchemy: una transacción externa + un SAVEPOINT que se reinicia tras
cada commit del código bajo test, con rollback total al final del test
para no dejar basura en la base de datos de desarrollo.
"""

from datetime import date, datetime, timezone
from decimal import Decimal

import pytest
from sqlalchemy import event

from app.database.session import SessionLocal, engine
from app.database.models.bank_connection import BankConnection, BankConnectionStatus
from app.database.models.financial_analysis import (
    AnalysisConfidence,
    FinancialAnalysis,
    FinancialAnalysisStatus,
    IncomeStability,
)
from app.database.models.user import User


@pytest.fixture
def db_session():
    connection = engine.connect()
    outer_transaction = connection.begin()
    session = SessionLocal(bind=connection)

    nested = connection.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def _restart_savepoint(sess, transaction):
        nonlocal nested
        if not nested.is_active:
            nested = connection.begin_nested()

    try:
        yield session
    finally:
        session.close()
        outer_transaction.rollback()
        connection.close()


@pytest.fixture
def make_user(db_session):
    created: list[User] = []

    def _make(email_suffix: str = "test") -> User:
        user = User(
            first_name="Bruno",
            last_name="Marconi",
            email=f"pytest_{email_suffix}_{len(created)}@example.com",
            password_hash="not-a-real-hash",
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        created.append(user)
        return user

    return _make


@pytest.fixture
def make_completed_analysis(db_session):
    def _make(
        user: User,
        *,
        months_analyzed: int = 6,
        status: FinancialAnalysisStatus = FinancialAnalysisStatus.COMPLETED,
        algorithm_version: str = "1.0",
    ) -> FinancialAnalysis:
        connection = BankConnection(
            user_id=user.id,
            status=BankConnectionStatus.CONNECTED,
        )
        db_session.add(connection)
        db_session.commit()
        db_session.refresh(connection)

        analysis = FinancialAnalysis(
            user_id=user.id,
            bank_connection_id=connection.id,
            status=status,
            algorithm_version=algorithm_version,
            analysis_period_start=date(2026, 2, 1),
            analysis_period_end=date(2026, 7, 31),
            months_analyzed=months_analyzed,
            accounts_analyzed=1,
            transactions_analyzed=50,
            average_monthly_income=Decimal("1500.00"),
            median_monthly_income=Decimal("1500.00"),
            recurring_monthly_income=Decimal("1500.00"),
            average_monthly_fixed_expenses=Decimal("650.00"),
            average_monthly_variable_expenses=Decimal("200.00"),
            average_monthly_outflows=Decimal("850.00"),
            average_monthly_net_margin=Decimal("650.00"),
            income_stability=IncomeStability.HIGH,
            analysis_confidence=AnalysisConfidence.HIGH,
            recommended_monthly_rent=Decimal("520.00"),
            result_summary="test",
            calculated_at=datetime.now(timezone.utc),
        )
        db_session.add(analysis)
        db_session.commit()
        db_session.refresh(analysis)
        return analysis

    return _make
