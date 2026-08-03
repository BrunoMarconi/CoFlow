from datetime import date, datetime, timezone
from decimal import Decimal

from app.database.models.financial_analysis import AnalysisConfidence, IncomeStability
from app.database.models.solvency_passport import (
    SolvencyPassport,
    SolvencyPassportStatus,
)
from app.services.pdf.solvency_passport_pdf import build_passport_pdf


def _sample_passport(**overrides) -> SolvencyPassport:
    passport = SolvencyPassport(
        public_id="SP-ABCDEF012345",
        status=SolvencyPassportStatus.ISSUED,
        algorithm_version="1.0",
        issued_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc),
        is_sandbox=True,
        currency="EUR",
        analysis_period_start=date(2026, 2, 1),
        analysis_period_end=date(2026, 7, 31),
        months_analyzed=6,
        recurring_monthly_income=Decimal("1500.00"),
        average_fixed_expenses=Decimal("650.00"),
        average_variable_expenses=Decimal("200.00"),
        average_monthly_margin=Decimal("650.00"),
        recommended_rent_capacity=Decimal("520.00"),
        income_stability=IncomeStability.HIGH,
        confidence_level=AnalysisConfidence.HIGH,
        holder_initials="B. M.",
    )
    for key, value in overrides.items():
        setattr(passport, key, value)
    return passport


def test_build_passport_pdf_produces_valid_pdf_bytes():
    passport = _sample_passport()

    pdf_bytes = build_passport_pdf(
        passport, "https://coflow.example/verificar/pasaporte/SP-ABCDEF012345?token=abc"
    )

    assert pdf_bytes.startswith(b"%PDF")
    assert len(pdf_bytes) > 1000


def test_build_passport_pdf_handles_missing_recommended_rent():
    passport = _sample_passport(recommended_rent_capacity=None)

    pdf_bytes = build_passport_pdf(
        passport, "https://coflow.example/verificar/pasaporte/SP-ABCDEF012345?token=abc"
    )

    assert pdf_bytes.startswith(b"%PDF")


def test_build_passport_pdf_works_for_revoked_passport():
    passport = _sample_passport(status=SolvencyPassportStatus.REVOKED)

    pdf_bytes = build_passport_pdf(
        passport, "https://coflow.example/verificar/pasaporte/SP-ABCDEF012345?token=abc"
    )

    assert pdf_bytes.startswith(b"%PDF")
