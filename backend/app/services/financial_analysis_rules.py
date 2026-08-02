"""Reglas deterministas del análisis financiero — funciones puras, sin DB.

Fundamentadas en los valores reales devueltos por TrueLayer Data API v1
sandbox (observados en una conexión real: `transaction_type` solo tiene
DEBIT/CREDIT; `category` solo tiene PURCHASE, BILL_PAYMENT, CREDIT,
DIRECT_DEBIT, TRANSFER, ATM, CASH; `amount` ya viene con signo — negativo
en DEBIT, positivo en CREDIT). No se asumen campos que TrueLayer no
devuelve. Cualquier combinación no vista cae en UNKNOWN_INFLOW/OUTFLOW en
vez de fallar.

Todo lo de aquí es puro (sin efectos secundarios, sin DB) para poder
testearlo sin infraestructura.
"""

from __future__ import annotations

import enum
import hashlib
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Sequence

FINANCIAL_ANALYSIS_ALGORITHM_VERSION = "1.0"

ANALYSIS_DISCLAIMER = (
    "Este resultado es orientativo y se basa en los datos bancarios "
    "autorizados durante el periodo analizado. No constituye un aval, "
    "una garantía de pago ni una aprobación automática para un alquiler."
)


class Direction(str, enum.Enum):
    INFLOW = "INFLOW"
    OUTFLOW = "OUTFLOW"
    NEUTRAL = "NEUTRAL"


class InflowClassification(str, enum.Enum):
    SALARY = "SALARY"
    PENSION = "PENSION"
    BENEFIT = "BENEFIT"
    SCHOLARSHIP = "SCHOLARSHIP"
    SELF_EMPLOYED_INCOME = "SELF_EMPLOYED_INCOME"
    RECURRING_TRANSFER = "RECURRING_TRANSFER"
    ONE_OFF_INCOME = "ONE_OFF_INCOME"
    REFUND = "REFUND"
    INTERNAL_TRANSFER = "INTERNAL_TRANSFER"
    LOAN = "LOAN"
    UNKNOWN_INFLOW = "UNKNOWN_INFLOW"


class OutflowClassification(str, enum.Enum):
    RENT = "RENT"
    UTILITIES = "UTILITIES"
    LOAN_PAYMENT = "LOAN_PAYMENT"
    INSURANCE = "INSURANCE"
    SUBSCRIPTION = "SUBSCRIPTION"
    TRANSPORT = "TRANSPORT"
    FOOD = "FOOD"
    LEISURE = "LEISURE"
    TAX = "TAX"
    INTERNAL_TRANSFER = "INTERNAL_TRANSFER"
    CASH_WITHDRAWAL = "CASH_WITHDRAWAL"
    OTHER_FIXED_EXPENSE = "OTHER_FIXED_EXPENSE"
    OTHER_VARIABLE_EXPENSE = "OTHER_VARIABLE_EXPENSE"
    UNKNOWN_OUTFLOW = "UNKNOWN_OUTFLOW"


class IncomeStability(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class AnalysisConfidence(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


FIXED_EXPENSE_CLASSIFICATIONS = {
    OutflowClassification.RENT.value,
    OutflowClassification.UTILITIES.value,
    OutflowClassification.LOAN_PAYMENT.value,
    OutflowClassification.INSURANCE.value,
    OutflowClassification.SUBSCRIPTION.value,
    OutflowClassification.TAX.value,
    OutflowClassification.OTHER_FIXED_EXPENSE.value,
}
VARIABLE_EXPENSE_CLASSIFICATIONS = {
    OutflowClassification.TRANSPORT.value,
    OutflowClassification.FOOD.value,
    OutflowClassification.LEISURE.value,
    OutflowClassification.CASH_WITHDRAWAL.value,
    OutflowClassification.OTHER_VARIABLE_EXPENSE.value,
    OutflowClassification.UNKNOWN_OUTFLOW.value,
}
# REFUND, INTERNAL_TRANSFER y LOAN quedan fuera a propósito (sección 6).
INCOME_COUNTING_CLASSIFICATIONS = {
    InflowClassification.SALARY.value,
    InflowClassification.PENSION.value,
    InflowClassification.BENEFIT.value,
    InflowClassification.SCHOLARSHIP.value,
    InflowClassification.SELF_EMPLOYED_INCOME.value,
    InflowClassification.RECURRING_TRANSFER.value,
    InflowClassification.ONE_OFF_INCOME.value,
    InflowClassification.UNKNOWN_INFLOW.value,
}

# --- Palabras clave de refinamiento (mayúsculas, ES/EN) ------------------
# Complementan la categoría de TrueLayer; nunca la sustituyen.
_SALARY_KEYWORDS = ("SALARY", "PAYROLL", "WAGES", "NOMINA", "SUELDO")
_PENSION_KEYWORDS = ("PENSION",)
_BENEFIT_KEYWORDS = (
    "DWP",
    "UNIVERSAL CREDIT",
    "BENEFIT",
    "AYUDA",
    "SUBSIDIO",
    "PRESTACION",
)
_SCHOLARSHIP_KEYWORDS = ("STUDENT LOANS", "SLC", "BECA", "SCHOLARSHIP")
_LOAN_KEYWORDS = ("LOAN", "PRESTAMO", "CREDITO PERSONAL")
_RENT_KEYWORDS = ("RENT", "ALQUILER", "ARRENDAMIENTO")
_INSURANCE_KEYWORDS = ("INSURANCE", "SEGURO")
_SUBSCRIPTION_KEYWORDS = (
    "NETFLIX",
    "SPOTIFY",
    "DISNEY",
    "SUBSCRIPTION",
    "SUSCRIPCION",
    "PRIME VIDEO",
    "HBO",
)
_UTILITIES_KEYWORDS = (
    "ELECTRIC",
    "GAS BILL",
    "WATER",
    "COUNCIL TAX",
    "LUZ",
    "AGUA",
    "ENDESA",
    "IBERDROLA",
    "NATURGY",
)
_TAX_KEYWORDS = ("DVLA", "HMRC", "TAX", "IMPUESTO", "HACIENDA", "AEAT")
_TRANSPORT_KEYWORDS = ("TFL", "UBER", "CABIFY", "RENFE", "METRO")
_FOOD_KEYWORDS = ("SPAR", "TESCO", "SAINSBURY", "ALDI", "LIDL", "MERCADONA", "CARREFOUR")
_LEISURE_KEYWORDS = ("CINEMA", "RESTAURANT", "NETFLIX")


def _matches_any(text: str, keywords: Sequence[str]) -> bool:
    return any(keyword in text for keyword in keywords)


# --- Normalización ---------------------------------------------------------

_DIGIT_RUN_RE = re.compile(r"\d{3,}")
_WHITESPACE_RE = re.compile(r"\s+")


def normalize_description(raw: str) -> str:
    """Mayúsculas, sin referencias numéricas largas, espacios colapsados."""
    upper = (raw or "").upper()
    without_refs = _DIGIT_RUN_RE.sub("", upper)
    return _WHITESPACE_RE.sub(" ", without_refs).strip()


def resolve_direction(amount: Decimal) -> Direction:
    if amount > 0:
        return Direction.INFLOW
    if amount < 0:
        return Direction.OUTFLOW
    return Direction.NEUTRAL


# --- Estructuras de datos ---------------------------------------------------


@dataclass(frozen=True)
class RawTransaction:
    id: str
    external_account_id: str
    amount: Decimal
    description: str
    transaction_type: str | None
    category: str | None
    occurred_at: datetime
    is_pending: bool


@dataclass(frozen=True)
class RecurrenceInfo:
    is_recurring: bool
    recurrence_group: str | None
    months_seen: int


@dataclass(frozen=True)
class ClassifiedTransaction:
    txn: RawTransaction
    direction: Direction
    classification: str
    is_recurring: bool = False
    recurrence_group: str | None = None

    @property
    def amount(self) -> Decimal:
        return self.txn.amount


@dataclass(frozen=True)
class MonthlySummaryData:
    year: int
    month: int
    total_income: Decimal
    recurring_income: Decimal
    total_fixed_expenses: Decimal
    total_variable_expenses: Decimal
    total_outflows: Decimal
    net_margin: Decimal
    income_sources_count: int


# --- Transferencias internas -------------------------------------------------

DEFAULT_TRANSFER_DATE_TOLERANCE_DAYS = 1


def detect_internal_transfers(
    transactions: Sequence[RawTransaction],
    *,
    date_tolerance_days: int = DEFAULT_TRANSFER_DATE_TOLERANCE_DAYS,
) -> set[str]:
    """Empareja TRANSFER de distinta cuenta (misma conexión), importe
    igual en valor absoluto y fecha próxima. Consumo greedy: cada
    transacción se empareja como máximo una vez. Agrupa por importe para
    evitar comparar todo contra todo (O(n) esperado, no O(n²))."""
    transfers = [t for t in transactions if (t.category or "").upper() == "TRANSFER"]

    debits = sorted(
        (t for t in transfers if t.amount < 0), key=lambda t: t.occurred_at
    )

    credits_by_amount: dict[Decimal, list[RawTransaction]] = defaultdict(list)
    for c in transfers:
        if c.amount > 0:
            credits_by_amount[c.amount].append(c)

    matched: set[str] = set()
    tolerance = timedelta(days=date_tolerance_days)

    for d in debits:
        if d.id in matched:
            continue

        candidates = credits_by_amount.get(-d.amount, [])
        for c in candidates:
            if c.id in matched:
                continue
            if c.external_account_id == d.external_account_id:
                continue
            if abs(c.occurred_at - d.occurred_at) <= tolerance:
                matched.add(d.id)
                matched.add(c.id)
                break

    return matched


# --- Recurrencia -------------------------------------------------------------

AMOUNT_TOLERANCE_RATIO = Decimal("0.15")
AMOUNT_TOLERANCE_ABSOLUTE = Decimal("10")
DAY_OF_MONTH_TOLERANCE = 5
MIN_MONTHS_FOR_RECURRING = 3


def _cluster_by_amount(
    txns: list[RawTransaction],
) -> list[list[RawTransaction]]:
    """Sub-agrupa transacciones de la misma descripción normalizada por
    importe parecido (tolerancia: mayor de 15% o 10€), ya que el mismo
    beneficiario puede aparecer con importes no relacionados."""
    ordered = sorted(txns, key=lambda t: abs(t.amount))
    clusters: list[list[RawTransaction]] = []
    current: list[RawTransaction] = []

    for t in ordered:
        if not current:
            current = [t]
            continue

        current_avg = sum((abs(c.amount) for c in current), Decimal("0")) / len(
            current
        )
        tolerance = max(current_avg * AMOUNT_TOLERANCE_RATIO, AMOUNT_TOLERANCE_ABSOLUTE)

        if abs(abs(t.amount) - current_avg) <= tolerance:
            current.append(t)
        else:
            clusters.append(current)
            current = [t]

    if current:
        clusters.append(current)

    return clusters


def _modal_day_of_month(txns: Sequence[RawTransaction]) -> int:
    counts = Counter(t.occurred_at.day for t in txns)
    max_count = max(counts.values())
    candidates = sorted(day for day, count in counts.items() if count == max_count)
    return candidates[len(candidates) // 2]


def detect_recurring_groups(
    transactions: Sequence[RawTransaction],
    *,
    excluded_ids: set[str],
) -> dict[str, RecurrenceInfo]:
    """Agrupa por (dirección, descripción normalizada), sub-agrupa por
    importe parecido, y exige >=3 meses distintos con el movimiento
    ocurriendo dentro de +/-5 días del día del mes más frecuente del
    grupo. Documentado: tolerancia de importe 15% (o 10€, lo mayor);
    tolerancia de fecha +/-5 días respecto a la moda."""
    groups: dict[tuple[Direction, str], list[RawTransaction]] = defaultdict(list)

    for t in transactions:
        if t.id in excluded_ids:
            continue
        direction = resolve_direction(t.amount)
        if direction == Direction.NEUTRAL:
            continue
        key = (direction, normalize_description(t.description))
        groups[key].append(t)

    result: dict[str, RecurrenceInfo] = {}

    for (direction, normalized_desc), group_txns in groups.items():
        if len(group_txns) < MIN_MONTHS_FOR_RECURRING:
            continue

        for cluster in _cluster_by_amount(group_txns):
            months = {(t.occurred_at.year, t.occurred_at.month) for t in cluster}
            if len(months) < MIN_MONTHS_FOR_RECURRING:
                continue

            modal_day = _modal_day_of_month(cluster)
            within_tolerance = [
                t
                for t in cluster
                if abs(t.occurred_at.day - modal_day) <= DAY_OF_MONTH_TOLERANCE
            ]
            months_within_tolerance = {
                (t.occurred_at.year, t.occurred_at.month) for t in within_tolerance
            }
            if len(months_within_tolerance) < MIN_MONTHS_FOR_RECURRING:
                continue

            group_id = f"{direction.value}:{normalized_desc}"

            # Como máximo una contribución agregada por grupo y mes: si
            # varias entradas del mismo grupo caen en el mismo mes (pago
            # duplicado, artefacto de sandbox, etc.), solo la más cercana
            # al día habitual del grupo cuenta como recurrente; el resto
            # se marca explícitamente como NO recurrente (pero conserva
            # el recurrence_group para poder auditarlo en diagnóstico) y
            # sigue contando como ingreso puntual normal, nunca dos veces
            # como recurrente.
            by_month: dict[tuple[int, int], list[RawTransaction]] = defaultdict(list)
            for t in within_tolerance:
                by_month[(t.occurred_at.year, t.occurred_at.month)].append(t)

            for month_txns in by_month.values():
                if len(month_txns) == 1:
                    primary = month_txns[0]
                    duplicates: list[RawTransaction] = []
                else:
                    primary = min(
                        month_txns,
                        key=lambda t: (
                            abs(t.occurred_at.day - modal_day),
                            -abs(t.amount),
                            t.id,
                        ),
                    )
                    duplicates = [t for t in month_txns if t.id != primary.id]

                result[primary.id] = RecurrenceInfo(
                    is_recurring=True,
                    recurrence_group=group_id,
                    months_seen=len(months_within_tolerance),
                )
                for dup in duplicates:
                    result[dup.id] = RecurrenceInfo(
                        is_recurring=False,
                        recurrence_group=group_id,
                        months_seen=len(months_within_tolerance),
                    )

    return result


# --- Clasificación -----------------------------------------------------------


def _classify_inflow(category: str, normalized_desc: str, is_recurring: bool) -> str:
    if category == "CREDIT":
        if _matches_any(normalized_desc, _SALARY_KEYWORDS):
            return InflowClassification.SALARY.value
        if _matches_any(normalized_desc, _PENSION_KEYWORDS):
            return InflowClassification.PENSION.value
        if _matches_any(normalized_desc, _BENEFIT_KEYWORDS):
            return InflowClassification.BENEFIT.value
        if _matches_any(normalized_desc, _SCHOLARSHIP_KEYWORDS):
            return InflowClassification.SCHOLARSHIP.value
        return (
            InflowClassification.RECURRING_TRANSFER.value
            if is_recurring
            else InflowClassification.ONE_OFF_INCOME.value
        )

    if category == "TRANSFER":
        if _matches_any(normalized_desc, _LOAN_KEYWORDS):
            return InflowClassification.LOAN.value
        return (
            InflowClassification.RECURRING_TRANSFER.value
            if is_recurring
            else InflowClassification.ONE_OFF_INCOME.value
        )

    if category == "PURCHASE":
        # TrueLayer marca así las devoluciones/reembolsos de compras.
        return InflowClassification.REFUND.value

    if category == "CASH":
        return (
            InflowClassification.RECURRING_TRANSFER.value
            if is_recurring
            else InflowClassification.ONE_OFF_INCOME.value
        )

    return InflowClassification.UNKNOWN_INFLOW.value


def _classify_outflow(category: str, normalized_desc: str) -> str:
    if category == "PURCHASE":
        if _matches_any(normalized_desc, _TRANSPORT_KEYWORDS):
            return OutflowClassification.TRANSPORT.value
        if _matches_any(normalized_desc, _FOOD_KEYWORDS):
            return OutflowClassification.FOOD.value
        if _matches_any(normalized_desc, _LEISURE_KEYWORDS):
            return OutflowClassification.LEISURE.value
        return OutflowClassification.OTHER_VARIABLE_EXPENSE.value

    if category in ("BILL_PAYMENT", "DIRECT_DEBIT"):
        if _matches_any(normalized_desc, _RENT_KEYWORDS):
            return OutflowClassification.RENT.value
        if _matches_any(normalized_desc, _TAX_KEYWORDS):
            return OutflowClassification.TAX.value
        if _matches_any(normalized_desc, _INSURANCE_KEYWORDS):
            return OutflowClassification.INSURANCE.value
        if _matches_any(normalized_desc, _SUBSCRIPTION_KEYWORDS):
            return OutflowClassification.SUBSCRIPTION.value
        if _matches_any(normalized_desc, _UTILITIES_KEYWORDS):
            return OutflowClassification.UTILITIES.value
        if _matches_any(normalized_desc, _LOAN_KEYWORDS):
            return OutflowClassification.LOAN_PAYMENT.value
        # BILL_PAYMENT/DIRECT_DEBIT ya implican "cargo programado" en
        # TrueLayer: por defecto se trata como gasto fijo.
        return OutflowClassification.OTHER_FIXED_EXPENSE.value

    if category == "TRANSFER":
        if _matches_any(normalized_desc, _LOAN_KEYWORDS):
            return OutflowClassification.LOAN_PAYMENT.value
        return OutflowClassification.OTHER_VARIABLE_EXPENSE.value

    if category in ("ATM", "CASH"):
        return OutflowClassification.CASH_WITHDRAWAL.value

    return OutflowClassification.UNKNOWN_OUTFLOW.value


def classify_transaction(
    txn: RawTransaction,
    *,
    internal_transfer_ids: set[str],
    recurrence: dict[str, RecurrenceInfo],
) -> ClassifiedTransaction:
    direction = resolve_direction(txn.amount)
    normalized = normalize_description(txn.description)
    category = (txn.category or "").upper()
    recurrence_info = recurrence.get(txn.id)
    is_recurring = recurrence_info.is_recurring if recurrence_info else False

    if txn.id in internal_transfer_ids:
        classification = (
            OutflowClassification.INTERNAL_TRANSFER.value
            if direction == Direction.OUTFLOW
            else InflowClassification.INTERNAL_TRANSFER.value
        )
    elif direction == Direction.INFLOW:
        classification = _classify_inflow(category, normalized, is_recurring)
    elif direction == Direction.OUTFLOW:
        classification = _classify_outflow(category, normalized)
    else:
        classification = InflowClassification.UNKNOWN_INFLOW.value

    return ClassifiedTransaction(
        txn=txn,
        direction=direction,
        classification=classification,
        is_recurring=is_recurring,
        recurrence_group=recurrence_info.recurrence_group if recurrence_info else None,
    )


def classify_transactions(
    transactions: Sequence[RawTransaction],
) -> list[ClassifiedTransaction]:
    """Pipeline completo: transferencias internas -> recurrencia -> clasificación."""
    internal_transfer_ids = detect_internal_transfers(transactions)
    recurrence = detect_recurring_groups(
        transactions, excluded_ids=internal_transfer_ids
    )
    return [
        classify_transaction(
            t, internal_transfer_ids=internal_transfer_ids, recurrence=recurrence
        )
        for t in transactions
    ]


# --- Periodo -------------------------------------------------------------


def resolve_analysis_period(
    reference_date: date,
    *,
    lookback_months: int = 6,
    max_months: int = 12,
) -> tuple[date, date, list[tuple[int, int]]]:
    """Últimos `lookback_months` meses completos (excluye el mes en
    curso de `reference_date`), acotado a `max_months`."""
    months_back = min(lookback_months, max_months)
    last_complete_month_end = reference_date.replace(day=1) - timedelta(days=1)

    months: list[tuple[int, int]] = []
    cursor = last_complete_month_end.replace(day=1)
    for _ in range(months_back):
        months.append((cursor.year, cursor.month))
        cursor = (cursor - timedelta(days=1)).replace(day=1)

    months.reverse()
    start = date(months[0][0], months[0][1], 1)
    return start, last_complete_month_end, months


# --- Resúmenes mensuales e indicadores --------------------------------------


def build_monthly_summaries(
    classified: Sequence[ClassifiedTransaction],
    months: Sequence[tuple[int, int]],
) -> list[MonthlySummaryData]:
    by_month: dict[tuple[int, int], list[ClassifiedTransaction]] = defaultdict(list)
    for c in classified:
        key = (c.txn.occurred_at.year, c.txn.occurred_at.month)
        by_month[key].append(c)

    summaries = []
    for year, month in months:
        month_txns = by_month.get((year, month), [])

        total_income = Decimal("0")
        recurring_income = Decimal("0")
        total_fixed = Decimal("0")
        total_variable = Decimal("0")
        income_sources: set[str] = set()

        for c in month_txns:
            if (
                c.direction == Direction.INFLOW
                and c.classification in INCOME_COUNTING_CLASSIFICATIONS
            ):
                total_income += c.amount
                income_sources.add(normalize_description(c.txn.description))
                if c.is_recurring:
                    recurring_income += c.amount
            elif c.direction == Direction.OUTFLOW:
                amount_abs = -c.amount
                if c.classification in FIXED_EXPENSE_CLASSIFICATIONS:
                    total_fixed += amount_abs
                elif c.classification in VARIABLE_EXPENSE_CLASSIFICATIONS:
                    total_variable += amount_abs

        total_outflows = total_fixed + total_variable

        summaries.append(
            MonthlySummaryData(
                year=year,
                month=month,
                total_income=total_income,
                recurring_income=recurring_income,
                total_fixed_expenses=total_fixed,
                total_variable_expenses=total_variable,
                total_outflows=total_outflows,
                net_margin=total_income - total_outflows,
                income_sources_count=len(income_sources),
            )
        )

    return summaries


def median_decimal(values: Sequence[Decimal]) -> Decimal:
    ordered = sorted(values)
    n = len(ordered)
    if n == 0:
        return Decimal("0")
    mid = n // 2
    if n % 2 == 1:
        return ordered[mid]
    return (ordered[mid - 1] + ordered[mid]) / 2


def mean_decimal(values: Sequence[Decimal]) -> Decimal:
    if not values:
        return Decimal("0")
    return sum(values, Decimal("0")) / len(values)


def _coefficient_of_variation(values: Sequence[Decimal]) -> Decimal:
    """Medida robusta de dispersión relativa a la media (0 = sin
    variación). Se usa para no dejar que un único mes extraordinario
    rompa la clasificación de estabilidad."""
    if len(values) < 2:
        return Decimal("0")

    mean_value = sum(values, Decimal("0")) / len(values)
    if mean_value == 0:
        return Decimal("0")

    variance = sum(((v - mean_value) ** 2 for v in values), Decimal("0")) / len(values)
    stdev = variance.sqrt()
    return stdev / mean_value


def calculate_income_stability(
    monthly_summaries: Sequence[MonthlySummaryData],
    months_analyzed: int,
) -> IncomeStability:
    """Sección 9, adaptada proporcionalmente cuando months_analyzed < 6."""
    if months_analyzed == 0:
        return IncomeStability.LOW

    months_with_recurring = sum(
        1 for m in monthly_summaries if m.recurring_income > 0
    )
    ratio = Decimal(months_with_recurring) / Decimal(months_analyzed)
    all_months_have_recurring = months_with_recurring == months_analyzed

    recurring_values = [
        m.recurring_income for m in monthly_summaries if m.recurring_income > 0
    ]
    variation = _coefficient_of_variation(recurring_values)

    if ratio >= Decimal("0.83") and all_months_have_recurring and variation <= Decimal(
        "0.35"
    ):
        return IncomeStability.HIGH

    if ratio >= Decimal("0.5"):
        return IncomeStability.MEDIUM

    return IncomeStability.LOW


def calculate_analysis_confidence(
    *,
    months_analyzed: int,
    transactions_analyzed: int,
    unknown_ratio: Decimal,
    has_identifiable_income: bool,
) -> AnalysisConfidence:
    """Sección 10. Mide calidad de datos, no solvencia."""
    if (
        months_analyzed >= 6
        and transactions_analyzed >= 30
        and unknown_ratio <= Decimal("0.15")
        and has_identifiable_income
    ):
        return AnalysisConfidence.HIGH

    if months_analyzed >= 3:
        return AnalysisConfidence.MEDIUM

    return AnalysisConfidence.LOW


def calculate_data_quality_score(
    *,
    months_analyzed: int,
    target_months: int,
    unknown_ratio: Decimal,
    months_with_recurring_ratio: Decimal,
) -> int:
    """0-100, interno. No es un score de solvencia (sección 12)."""
    coverage = min(Decimal(months_analyzed) / Decimal(max(target_months, 1)), Decimal("1"))
    classified = Decimal("1") - min(unknown_ratio, Decimal("1"))

    total = (
        coverage * Decimal("45")
        + classified * Decimal("30")
        + months_with_recurring_ratio * Decimal("25")
    )
    return max(0, min(100, int(total)))


INCOME_LIMIT_RATIO = Decimal("0.35")
MEDIAN_FALLBACK_RATIO = Decimal("0.30")
MARGIN_LIMIT_RATIO = Decimal("0.70")
HARD_CAP_RATIO = Decimal("0.40")
LOW_CONFIDENCE_REDUCTION = Decimal("0.15")
ROUND_STEP = Decimal("10")


def calculate_recommended_rent(
    *,
    recurring_monthly_income: Decimal | None,
    median_monthly_income: Decimal | None,
    average_monthly_net_margin: Decimal | None,
    confidence: AnalysisConfidence,
    income_stability: IncomeStability,
) -> Decimal | None:
    """Sección 11, fórmula exacta y centralizada.

    income_limit = 35% de recurring_monthly_income, o 30% de
    median_monthly_income si los ingresos recurrentes no son fiables
    (poco importe, o estabilidad LOW). margin_limit = 70% del margen
    medio positivo. recommended = min(income_limit, margin_limit), sin
    superar nunca el 40% de recurring_monthly_income, redondeado hacia
    abajo a múltiplos de 10€. Si confidence es LOW, se reduce un 15%
    adicional. None si no hay margen positivo o no hay base de ingresos.
    """
    if average_monthly_net_margin is None or average_monthly_net_margin <= 0:
        return None

    income_is_reliable = (
        recurring_monthly_income is not None
        and recurring_monthly_income > 0
        and income_stability != IncomeStability.LOW
    )

    if income_is_reliable:
        assert recurring_monthly_income is not None
        income_limit = recurring_monthly_income * INCOME_LIMIT_RATIO
    elif median_monthly_income is not None and median_monthly_income > 0:
        income_limit = median_monthly_income * MEDIAN_FALLBACK_RATIO
    else:
        return None

    margin_limit = average_monthly_net_margin * MARGIN_LIMIT_RATIO
    recommended = min(income_limit, margin_limit)

    if recurring_monthly_income is not None and recurring_monthly_income > 0:
        recommended = min(recommended, recurring_monthly_income * HARD_CAP_RATIO)

    if confidence == AnalysisConfidence.LOW:
        recommended = recommended * (Decimal("1") - LOW_CONFIDENCE_REDUCTION)

    if recommended <= 0:
        return None

    floored = (recommended // ROUND_STEP) * ROUND_STEP
    return floored if floored > 0 else None


# --- Diagnóstico (solo desarrollo) ------------------------------------------
#
# Todo lo de aquí es de solo lectura y no debe usarse en ningún cálculo del
# análisis en sí. Sirve únicamente para auditar por qué recurring_monthly_income
# sale como sale. Nunca incluye tokens, IBAN, números de cuenta, ids
# completos ni descripciones completas — solo alias anonimizados (hash) y
# agregados.


@dataclass(frozen=True)
class RecurringGroupDiagnostic:
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


def _anonymize(value: str, length: int = 8) -> str:
    return hashlib.sha256(value.encode()).hexdigest()[:length].upper()


def build_recurring_income_diagnostics(
    classified: Sequence[ClassifiedTransaction],
) -> list[RecurringGroupDiagnostic]:
    """Agrupa las transacciones ya clasificadas por `recurrence_group` y
    construye un informe anonimizado por grupo, restringido a movimientos
    de dirección INFLOW (es un diagnóstico de *ingresos* recurrentes).

    Incluye también grupos cuya clasificación final es REFUND, LOAN o
    INTERNAL_TRANSFER si llegaron a acumular un patrón recurrente, para
    poder detectar justo el tipo de artefacto que el sandbox puede
    producir (un reembolso o una transferencia interna que por casualidad
    se repite varios meses) — su `monthly_contribution` sale en 0 porque
    esas clasificaciones están excluidas de INCOME_COUNTING_CLASSIFICATIONS,
    lo cual es visible y auditable en el propio informe.
    """
    by_group: dict[str, list[ClassifiedTransaction]] = defaultdict(list)
    for c in classified:
        if c.recurrence_group is not None and c.direction == Direction.INFLOW:
            by_group[c.recurrence_group].append(c)

    diagnostics: list[RecurringGroupDiagnostic] = []

    for group_id, members in by_group.items():
        primaries = [m for m in members if m.is_recurring]
        if not primaries:
            continue

        duplicates = [m for m in members if not m.is_recurring]
        amounts = [m.amount for m in primaries]
        months = sorted(
            {
                f"{m.txn.occurred_at.year:04d}-{m.txn.occurred_at.month:02d}"
                for m in primaries
            }
        )
        months_seen = len(months)

        if months_seen >= 5:
            confidence = "HIGH"
        elif months_seen >= 3:
            confidence = "MEDIUM"
        else:
            confidence = "LOW"

        accounts = {m.txn.external_account_id for m in members}
        account_alias = (
            _anonymize(next(iter(accounts)))
            if len(accounts) == 1
            else f"{len(accounts)} cuentas distintas"
        )

        classification = primaries[0].classification
        monthly_contribution = (
            mean_decimal(amounts)
            if classification in INCOME_COUNTING_CLASSIFICATIONS
            else Decimal("0")
        )
        looks_like_internal_transfer = (
            classification == InflowClassification.INTERNAL_TRANSFER.value
            or len(accounts) > 1
        )

        reason = (
            f"Aparece en {months_seen} meses distintos del periodo analizado, "
            f"con importes dentro de tolerancia (mayor de 15% o 10€) y en "
            f"fechas a +/-{DAY_OF_MONTH_TOLERANCE} días del día habitual del "
            "grupo."
        )
        if duplicates:
            reason += (
                f" Había {len(duplicates)} movimiento(s) adicional(es) del "
                "mismo grupo en el mismo mes: no se sumaron dos veces, solo "
                "el más cercano al día habitual cuenta como recurrente."
            )
        if classification not in INCOME_COUNTING_CLASSIFICATIONS:
            reason += (
                f" Clasificado como {classification}: excluido de "
                "recurring_monthly_income aunque el patrón sea recurrente."
            )

        diagnostics.append(
            RecurringGroupDiagnostic(
                group_alias=_anonymize(group_id),
                classification=classification,
                confidence=confidence,
                months=months,
                transaction_count=len(primaries),
                average_amount=mean_decimal(amounts),
                minimum_amount=min(amounts),
                maximum_amount=max(amounts),
                monthly_contribution=monthly_contribution,
                account_alias=account_alias,
                looks_like_internal_transfer=looks_like_internal_transfer,
                duplicate_in_month_count=len(duplicates),
                reason=reason,
            )
        )

    diagnostics.sort(key=lambda d: d.monthly_contribution, reverse=True)
    return diagnostics
