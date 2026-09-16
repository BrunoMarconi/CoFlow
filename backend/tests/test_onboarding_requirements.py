"""Tests de los tres datos obligatorios del onboarding (edad, ocupación y
avatar) y de la edad derivada que se le propone al usuario.

Completar el onboarding es lo que abre comunidades y el perfil público,
así que la comprobación no puede vivir solo en el frontend: aquí se fija
que el servicio rechace un perfil a medias aunque las 19 respuestas de
convivencia lleguen completas.
"""

from datetime import date

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.core.config import MINIMUM_REGISTRATION_AGE
from app.schemas.onboarding import OnboardingCreate
from app.schemas.user import UpdateProfileRequest, UserResponse
from app.services.onboarding_service import ANSWER_FIELDS, OnboardingService

onboarding_service = OnboardingService()

ANSWERS = OnboardingCreate(**{field: "Respuesta" for field in ANSWER_FIELDS})


def _complete_profile(user):
    user.age = 22
    user.occupation = "Estudiante"
    user.avatar_storage_key = "avatars/whatever.webp"
    user.avatar_url = "https://cdn.example.com/avatars/whatever.webp"


def test_onboarding_completes_with_age_occupation_and_avatar(
    db_session, make_user
):
    user = make_user("onboarding-complete")
    _complete_profile(user)
    db_session.commit()

    onboarding_service.save_or_update_profile(db_session, user, ANSWERS)

    assert user.onboarding_completed is True


@pytest.mark.parametrize(
    "missing_field, expected_text",
    [
        ("age", "tu edad"),
        ("occupation", "tu ocupación"),
        ("avatar", "una foto o un avatar de CoFlow"),
    ],
)
def test_onboarding_rejected_when_a_required_field_is_missing(
    db_session, make_user, missing_field, expected_text
):
    user = make_user(f"onboarding-missing-{missing_field}")
    _complete_profile(user)
    if missing_field == "avatar":
        user.avatar_storage_key = None
        user.avatar_url = None
    else:
        setattr(user, missing_field, None)
    db_session.commit()

    with pytest.raises(HTTPException) as raised:
        onboarding_service.save_or_update_profile(db_session, user, ANSWERS)

    assert raised.value.status_code == 422
    assert expected_text in raised.value.detail
    assert user.onboarding_completed is False


def test_onboarding_rejects_whitespace_only_occupation(db_session, make_user):
    user = make_user("onboarding-blank-occupation")
    _complete_profile(user)
    user.occupation = "   "
    db_session.commit()

    with pytest.raises(HTTPException) as raised:
        onboarding_service.save_or_update_profile(db_session, user, ANSWERS)

    assert "tu ocupación" in raised.value.detail


def test_onboarding_accepts_a_preset_avatar_without_legacy_url(
    db_session, make_user
):
    """El avatar de CoFlow se sube como archivo: basta la storage key."""
    user = make_user("onboarding-preset-avatar")
    _complete_profile(user)
    user.avatar_url = None
    db_session.commit()

    onboarding_service.save_or_update_profile(db_session, user, ANSWERS)

    assert user.onboarding_completed is True


def test_profile_accepts_a_minor_over_the_registration_age():
    request = UpdateProfileRequest(
        first_name="Ada", last_name="Lovelace", age=MINIMUM_REGISTRATION_AGE
    )

    assert request.age == MINIMUM_REGISTRATION_AGE


def test_profile_rejects_an_age_below_the_registration_age():
    with pytest.raises(ValidationError):
        UpdateProfileRequest(
            first_name="Ada",
            last_name="Lovelace",
            age=MINIMUM_REGISTRATION_AGE - 1,
        )


def test_response_derives_age_without_exposing_the_birth_date(
    db_session, make_user
):
    user = make_user("derived-age")
    # El 1 de enero ya ha pasado (o es hoy) cualquier día del año, así que
    # los años cumplidos son siempre 17 sin depender de la fecha del test.
    user.birth_date = date(date.today().year - 17, 1, 1)
    db_session.commit()

    payload = UserResponse.model_validate(user).model_dump()

    assert payload["age_from_birth_date"] == 17
    assert "birth_date" not in payload


def test_response_has_no_derived_age_without_a_birth_date(
    db_session, make_user
):
    """Las cuentas de Google entran sin fecha de nacimiento."""
    user = make_user("derived-age-missing")

    payload = UserResponse.model_validate(user).model_dump()

    assert payload["age_from_birth_date"] is None
