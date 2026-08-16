from app.database.models.compatibility_profile import CompatibilityProfile
from app.services.compatibility_score_service import (
    QUESTION_DIRECTION,
    QUESTION_OPTIONS,
    compute_match_score,
)


def _profile(option_index: int) -> CompatibilityProfile:
    return CompatibilityProfile(
        **{
            question: options[option_index]
            for question, options in QUESTION_OPTIONS.items()
        }
    )


def _profile_with_raw_score(low: bool) -> CompatibilityProfile:
    """Perfil cuyas 19 respuestas puntúan todas 0 (low=True) o todas
    100 (low=False), sea cual sea la dirección de cada pregunta —
    a diferencia de _profile(), que fija el mismo índice de opción
    para todas y por tanto NO da puntuaciones uniformes (la dirección
    de cada pregunta invierte lo que significa cada índice)."""
    values = {}
    for question, options in QUESTION_OPTIONS.items():
        wants_index_zero = QUESTION_DIRECTION[question] == low
        values[question] = options[0] if wants_index_zero else options[3]
    return CompatibilityProfile(**values)


def test_identical_profiles_are_fully_compatible():
    profile = _profile(1)
    assert compute_match_score(profile, profile) == 100


def test_opposite_profiles_are_not_compatible():
    profile_a = _profile_with_raw_score(low=True)
    profile_b = _profile_with_raw_score(low=False)
    assert compute_match_score(profile_a, profile_b) == 0


def test_match_score_is_symmetric():
    profile_a = _profile(0)
    profile_b = _profile(2)
    assert compute_match_score(profile_a, profile_b) == compute_match_score(
        profile_b, profile_a
    )


def test_partial_overlap_gives_intermediate_score():
    profile_a = _profile(1)
    profile_b = _profile(2)
    score = compute_match_score(profile_a, profile_b)
    assert 0 < score < 100
