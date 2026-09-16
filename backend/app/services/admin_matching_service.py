from __future__ import annotations

from dataclasses import dataclass

from app.database.models.compatibility_profile import CompatibilityProfile
from app.database.models.user import User
from app.schemas.admin import AdminHardFilter, AdminScoreFactor
from app.services.compatibility_score_service import QUESTION_OPTIONS


@dataclass(frozen=True)
class MatchResult:
    score: int
    eligible: bool
    hard_filters: list[AdminHardFilter]
    factors: list[AdminScoreFactor]
    shared_interests: list[str]


FACTOR_WEIGHTS = {
    "cleanliness": 15,
    "schedule": 12,
    "sociability": 13,
    "smoking": 15,
    "noise": 13,
    "guests": 10,
    "pets": 10,
    "lifestyle": 12,
}


def _answer_similarity(question: str, first: str, second: str) -> int:
    options = QUESTION_OPTIONS[question]
    try:
        distance = abs(options.index(first) - options.index(second))
    except ValueError:
        return 50
    return round(100 - distance / max(1, len(options) - 1) * 100)


def _average(profile_a: CompatibilityProfile, profile_b: CompatibilityProfile, questions: list[str]) -> int:
    return round(sum(_answer_similarity(key, getattr(profile_a, key), getattr(profile_b, key)) for key in questions) / len(questions))


def _factor(key: str, label: str, score: int, detail: str) -> AdminScoreFactor:
    return AdminScoreFactor(key=key, label=label, score=score, weight=FACTOR_WEIGHTS[key], detail=detail)


def _missing_result(first: User, second: User) -> MatchResult:
    filters = base_hard_filters(first, second)
    filters.append(AdminHardFilter(key="compatibility", label="Perfil de convivencia", passed=False, detail="Falta completar el test de convivencia."))
    return MatchResult(score=0, eligible=False, hard_filters=filters, factors=[], shared_interests=[])


def base_hard_filters(first: User, second: User) -> list[AdminHardFilter]:
    both_looking = first.is_looking_for_roommates and second.is_looking_for_roommates
    if first.rental_budget is None or second.rental_budget is None:
        budget_passed = None
        budget_detail = "Falta el presupuesto de una de las personas."
    else:
        ratio = min(first.rental_budget, second.rental_budget) / max(first.rental_budget, second.rental_budget)
        budget_passed = ratio >= 0.7
        budget_detail = f"{first.rental_budget} € y {second.rental_budget} € al mes."
    return [
        AdminHardFilter(key="availability", label="Disponibilidad", passed=both_looking, detail="Ambas personas buscan comunidad." if both_looking else "Una de las personas tiene la búsqueda pausada."),
        AdminHardFilter(key="budget", label="Presupuesto", passed=budget_passed, detail=budget_detail),
        AdminHardFilter(key="zone", label="Zona", passed=None, detail="CoFlow aún no recoge zonas preferidas en el perfil personal."),
        AdminHardFilter(key="move_in", label="Fecha de entrada", passed=None, detail="CoFlow aún no recoge fecha de entrada en el perfil personal."),
    ]


def calculate_match(first: User, second: User) -> MatchResult:
    first_profile = first.compatibility_profile
    second_profile = second.compatibility_profile
    if first_profile is None or second_profile is None:
        return _missing_result(first, second)

    filters = base_hard_filters(first, second)
    smoking_conflict = (
        (first_profile.smoking == QUESTION_OPTIONS["smoking"][0] and second_profile.smoking == QUESTION_OPTIONS["smoking"][3])
        or (second_profile.smoking == QUESTION_OPTIONS["smoking"][0] and first_profile.smoking == QUESTION_OPTIONS["smoking"][3])
    )
    pets_conflict = (
        (first_profile.pets == QUESTION_OPTIONS["pets"][0] and second_profile.pets == QUESTION_OPTIONS["pets"][3])
        or (second_profile.pets == QUESTION_OPTIONS["pets"][0] and first_profile.pets == QUESTION_OPTIONS["pets"][3])
    )
    restrictions_ok = not smoking_conflict and not pets_conflict
    restriction_notes = []
    if smoking_conflict:
        restriction_notes.append("conflicto con fumar")
    if pets_conflict:
        restriction_notes.append("conflicto con mascotas")
    filters.append(AdminHardFilter(
        key="restrictions", label="Restricciones relevantes", passed=restrictions_ok,
        detail="Sin incompatibilidades bloqueantes." if restrictions_ok else ", ".join(restriction_notes).capitalize() + ".",
    ))

    first_interests = {value.casefold(): value for value in first.interests}
    second_interests = {value.casefold(): value for value in second.interests}
    shared = [first_interests[key] for key in first_interests.keys() & second_interests.keys()]
    interest_union = len(first_interests.keys() | second_interests.keys())
    interests_score = round(len(shared) / interest_union * 100) if interest_union else 50
    lifestyle_score = round((_answer_similarity("lifestyle", first_profile.lifestyle, second_profile.lifestyle) + interests_score) / 2)

    factors = [
        _factor("cleanliness", "Limpieza", _average(first_profile, second_profile, ["cleanliness", "dishes", "common_objects"]), "Orden, vajilla y uso de espacios comunes."),
        _factor("schedule", "Horarios", _average(first_profile, second_profile, ["wake_up", "night_noise"]), "Rutina de mañana y tolerancia nocturna."),
        _factor("sociability", "Sociabilidad", _average(first_profile, second_profile, ["space", "lifestyle"]), "Espacio personal y vida en común."),
        _factor("smoking", "Fumar", _answer_similarity("smoking", first_profile.smoking, second_profile.smoking), "Preferencias sobre tabaco en casa."),
        _factor("noise", "Fiestas y ruido", _average(first_profile, second_profile, ["noise", "night_noise", "alcohol"]), "Ambiente, ruido nocturno y vida social."),
        _factor("guests", "Invitados", _average(first_profile, second_profile, ["visits", "sleepovers"]), "Visitas y personas que se quedan a dormir."),
        _factor("pets", "Mascotas", _answer_similarity("pets", first_profile.pets, second_profile.pets), "Preferencias y convivencia con animales."),
        _factor("lifestyle", "Intereses y estilo de vida", lifestyle_score, "Afinidad declarada y estilo de convivencia."),
    ]
    score = round(sum(factor.score * factor.weight for factor in factors) / 100)
    eligible = all(item.passed is not False for item in filters)
    return MatchResult(score=score, eligible=eligible, hard_filters=filters, factors=factors, shared_interests=sorted(shared))
