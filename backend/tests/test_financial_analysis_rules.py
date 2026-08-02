from datetime import date, datetime, timezone
from decimal import Decimal

from app.services.financial_analysis_rules import (
    AnalysisConfidence,
    FIXED_EXPENSE_CLASSIFICATIONS,
    INCOME_COUNTING_CLASSIFICATIONS,
    IncomeStability,
    RawTransaction,
    build_monthly_summaries,
    calculate_analysis_confidence,
    calculate_income_stability,
    calculate_recommended_rent,
    classify_transactions,
    detect_internal_transfers,
    detect_recurring_groups,
    mean_decimal,
    median_decimal,
    resolve_analysis_period,
    resolve_direction,
)


def _dt(year: int, month: int, day: int) -> datetime:
    return datetime(year, month, day, 12, 0, tzinfo=timezone.utc)


def _txn(
    id_: str,
    amount: str,
    description: str,
    category: str,
    when: datetime,
    *,
    account: str = "acc-1",
    transaction_type: str | None = None,
) -> RawTransaction:
    decimal_amount = Decimal(amount)
    return RawTransaction(
        id=id_,
        external_account_id=account,
        amount=decimal_amount,
        description=description,
        transaction_type=transaction_type
        or ("CREDIT" if decimal_amount > 0 else "DEBIT"),
        category=category,
        occurred_at=when,
        is_pending=False,
    )


# --- Periodo -----------------------------------------------------------------


def test_resolve_analysis_period_returns_six_complete_months_excluding_current():
    start, end, months = resolve_analysis_period(date(2026, 8, 2))

    assert months == [
        (2026, 2),
        (2026, 3),
        (2026, 4),
        (2026, 5),
        (2026, 6),
        (2026, 7),
    ]
    assert start == date(2026, 2, 1)
    assert end == date(2026, 7, 31)


# --- Clasificación de ingresos -------------------------------------------------


def test_salary_recurring_six_months_is_detected_as_high_stability():
    txns = [
        _txn(f"sal-{m}", "1500.00", "ACME LTD SALARY", "CREDIT", _dt(2026, m, 25))
        for m in range(1, 7)
    ]

    classified = classify_transactions(txns)

    assert all(c.classification == "SALARY" for c in classified)
    assert all(c.is_recurring for c in classified)

    months = [(2026, m) for m in range(1, 7)]
    summaries = build_monthly_summaries(classified, months)
    stability = calculate_income_stability(summaries, months_analyzed=6)

    assert stability == IncomeStability.HIGH


def test_self_employed_variable_income_detected_as_recurring_transfer():
    amounts = ["1200.00", "1350.00", "1080.00", "1290.00"]
    txns = [
        _txn(f"freelance-{i}", amount, "MR JOHN SMITH", "CREDIT", _dt(2026, i + 1, 10))
        for i, amount in enumerate(amounts)
    ]

    classified = classify_transactions(txns)

    assert all(c.classification == "RECURRING_TRANSFER" for c in classified)
    assert all(c.is_recurring for c in classified)


def test_one_off_large_income_is_not_recurring_and_median_resists_outlier():
    txns = [
        _txn("payday-1", "1500.00", "ACME LTD SALARY", "CREDIT", _dt(2026, 1, 25)),
        _txn("payday-2", "1500.00", "ACME LTD SALARY", "CREDIT", _dt(2026, 2, 25)),
        _txn("payday-3", "1500.00", "ACME LTD SALARY", "CREDIT", _dt(2026, 3, 25)),
        _txn("windfall", "9000.00", "LOTTERY WIN", "CREDIT", _dt(2026, 2, 5)),
    ]

    classified = classify_transactions(txns)
    windfall = next(c for c in classified if c.txn.id == "windfall")

    assert windfall.classification == "ONE_OFF_INCOME"
    assert windfall.is_recurring is False

    months = [(2026, 1), (2026, 2), (2026, 3)]
    summaries = build_monthly_summaries(classified, months)
    incomes = [s.total_income for s in summaries]

    average = mean_decimal(incomes)
    median = median_decimal(incomes)
    assert median < average  # la mediana resiste el mes con el ingreso puntual


def test_loan_received_is_excluded_from_income():
    txn = _txn("loan-1", "5000.00", "PERSONAL LOAN DISBURSEMENT", "TRANSFER", _dt(2026, 3, 1))

    classified = classify_transactions([txn])

    assert classified[0].classification == "LOAN"
    assert "LOAN" not in INCOME_COUNTING_CLASSIFICATIONS


def test_refund_is_excluded_from_income():
    txn = _txn("refund-1", "43.50", "MT SECURETRADE LIM", "PURCHASE", _dt(2026, 3, 14))

    classified = classify_transactions([txn])

    assert classified[0].classification == "REFUND"
    assert "REFUND" not in INCOME_COUNTING_CLASSIFICATIONS


def test_internal_transfer_between_own_accounts_is_excluded_from_income_and_expense():
    debit = _txn("out-1", "-200.00", "MR JOHN SMITH", "TRANSFER", _dt(2026, 3, 10), account="acc-1")
    credit = _txn("in-1", "200.00", "MR JOHN SMITH", "TRANSFER", _dt(2026, 3, 10), account="acc-2")

    internal = detect_internal_transfers([debit, credit])
    assert internal == {"out-1", "in-1"}

    classified = classify_transactions([debit, credit])
    classifications = {c.txn.id: c.classification for c in classified}
    assert classifications["out-1"] == "INTERNAL_TRANSFER"
    assert classifications["in-1"] == "INTERNAL_TRANSFER"

    months = [(2026, 3)]
    summaries = build_monthly_summaries(classified, months)
    assert summaries[0].total_income == Decimal("0")
    assert summaries[0].total_outflows == Decimal("0")


def test_transfer_same_account_is_not_treated_as_internal():
    debit = _txn("out-2", "-200.00", "MR JOHN SMITH", "TRANSFER", _dt(2026, 3, 10), account="acc-1")
    credit = _txn("in-2", "200.00", "MR JOHN SMITH", "TRANSFER", _dt(2026, 3, 10), account="acc-1")

    internal = detect_internal_transfers([debit, credit])
    assert internal == set()


# --- Gastos --------------------------------------------------------------------


def test_direct_debit_without_keyword_is_other_fixed_expense():
    txn = _txn("dd-1", "-20.56", "DVLA LICENSE", "DIRECT_DEBIT", _dt(2026, 3, 27))

    classified = classify_transactions([txn])

    assert classified[0].classification == "TAX"
    assert "TAX" in FIXED_EXPENSE_CLASSIFICATIONS


def test_subscription_keyword_is_detected_as_fixed_expense():
    txn = _txn("sub-1", "-9.99", "NETFLIX.COM", "DIRECT_DEBIT", _dt(2026, 3, 5))

    classified = classify_transactions([txn])

    assert classified[0].classification == "SUBSCRIPTION"
    assert "SUBSCRIPTION" in FIXED_EXPENSE_CLASSIFICATIONS


def test_cash_withdrawal_is_variable_not_fixed():
    txn = _txn("atm-1", "-30.00", "LNK ATM LONDON", "ATM", _dt(2026, 3, 2))

    classified = classify_transactions([txn])

    assert classified[0].classification == "CASH_WITHDRAWAL"
    assert "CASH_WITHDRAWAL" not in FIXED_EXPENSE_CLASSIFICATIONS


def test_month_with_no_income_produces_zero_totals():
    txn = _txn("exp-only", "-50.00", "SPAR", "PURCHASE", _dt(2026, 4, 10))

    classified = classify_transactions([txn])
    summaries = build_monthly_summaries(classified, [(2026, 4)])

    assert summaries[0].total_income == Decimal("0")
    assert summaries[0].net_margin < 0


# --- Capacidad orientativa -------------------------------------------------


def test_recommended_rent_matches_worked_example_from_spec():
    rent = calculate_recommended_rent(
        recurring_monthly_income=Decimal("1500"),
        median_monthly_income=Decimal("1500"),
        average_monthly_net_margin=Decimal("850"),
        confidence=AnalysisConfidence.HIGH,
        income_stability=IncomeStability.HIGH,
    )

    assert rent == Decimal("520")


def test_recommended_rent_is_none_when_margin_not_positive():
    rent = calculate_recommended_rent(
        recurring_monthly_income=Decimal("1500"),
        median_monthly_income=Decimal("1500"),
        average_monthly_net_margin=Decimal("-50"),
        confidence=AnalysisConfidence.HIGH,
        income_stability=IncomeStability.HIGH,
    )

    assert rent is None


def test_recommended_rent_never_exceeds_forty_percent_of_recurring_income():
    rent = calculate_recommended_rent(
        recurring_monthly_income=Decimal("1000"),
        median_monthly_income=Decimal("1000"),
        average_monthly_net_margin=Decimal("5000"),
        confidence=AnalysisConfidence.HIGH,
        income_stability=IncomeStability.HIGH,
    )

    assert rent is not None
    assert rent <= Decimal("1000") * Decimal("0.40")


def test_recommended_rent_falls_back_to_median_when_no_recurring_income():
    rent = calculate_recommended_rent(
        recurring_monthly_income=None,
        median_monthly_income=Decimal("1000"),
        average_monthly_net_margin=Decimal("400"),
        confidence=AnalysisConfidence.MEDIUM,
        income_stability=IncomeStability.LOW,
    )

    # 30% de 1000 = 300; 70% de 400 = 280 -> min = 280 -> floor a 280
    assert rent == Decimal("280")


# --- Confianza y estabilidad -------------------------------------------------


def test_confidence_is_low_with_fewer_than_three_months():
    confidence = calculate_analysis_confidence(
        months_analyzed=2,
        transactions_analyzed=10,
        unknown_ratio=Decimal("0.5"),
        has_identifiable_income=False,
    )
    assert confidence == AnalysisConfidence.LOW


def test_confidence_is_medium_with_three_to_five_months():
    confidence = calculate_analysis_confidence(
        months_analyzed=4,
        transactions_analyzed=40,
        unknown_ratio=Decimal("0.05"),
        has_identifiable_income=True,
    )
    assert confidence == AnalysisConfidence.MEDIUM


def test_confidence_is_high_with_six_months_and_clean_data():
    confidence = calculate_analysis_confidence(
        months_analyzed=6,
        transactions_analyzed=120,
        unknown_ratio=Decimal("0.02"),
        has_identifiable_income=True,
    )
    assert confidence == AnalysisConfidence.HIGH


def test_stability_low_with_sparse_recurring_income():
    months = [(2026, m) for m in range(1, 7)]
    txns = [
        _txn("sal-1", "1500.00", "ACME LTD SALARY", "CREDIT", _dt(2026, 1, 25)),
    ]
    classified = classify_transactions(txns)
    summaries = build_monthly_summaries(classified, months)

    stability = calculate_income_stability(summaries, months_analyzed=6)
    assert stability == IncomeStability.LOW


def test_stability_medium_with_partial_recurring_income():
    txns = [
        _txn(f"sal-{m}", "1500.00", "ACME LTD SALARY", "CREDIT", _dt(2026, m, 25))
        for m in (1, 2, 3, 4)
    ]
    classified = classify_transactions(txns)
    months = [(2026, m) for m in range(1, 7)]
    summaries = build_monthly_summaries(classified, months)

    stability = calculate_income_stability(summaries, months_analyzed=6)
    assert stability == IncomeStability.MEDIUM


# --- Utilidades ----------------------------------------------------------------


def test_resolve_direction_uses_amount_sign():
    assert resolve_direction(Decimal("10")).value == "INFLOW"
    assert resolve_direction(Decimal("-10")).value == "OUTFLOW"
    assert resolve_direction(Decimal("0")).value == "NEUTRAL"


def test_detect_recurring_groups_requires_at_least_three_months():
    txns = [
        _txn(f"sal-{m}", "1500.00", "ACME LTD SALARY", "CREDIT", _dt(2026, m, 25))
        for m in (1, 2)
    ]
    recurrence = detect_recurring_groups(txns, excluded_ids=set())
    assert recurrence == {}
