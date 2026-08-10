"""Tests para los campos de perfil añadidos (edad, ocupación, bio) y
para el estado "En línea"/"Verificado" calculado en el perfil público
a partir de last_active_at / is_email_verified — no son campos
inventados en el frontend, se derivan de datos reales."""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.core.dependencies import get_current_user, _LAST_ACTIVE_WRITE_THROTTLE
from app.database.session import get_db
from app.main import app
from app.schemas.user import UpdateProfileRequest
from app.services.auth_service import AuthService
from app.services.user_service import UserService, ONLINE_THRESHOLD

auth_service = AuthService()
user_service = UserService()


def _client(db_session) -> TestClient:
    app.dependency_overrides[get_db] = lambda: db_session
    return TestClient(app)


def test_update_profile_persists_age_occupation_bio(db_session, make_user):
    user = make_user("extra-fields")

    auth_service.update_profile(
        current_user=user,
        data=UpdateProfileRequest(
            first_name=user.first_name,
            last_name=user.last_name,
            age=27,
            occupation="Diseñadora UX",
            bio="Ordenada y tranquila, me encanta cocinar.",
        ),
        db=db_session,
    )

    assert user.age == 27
    assert user.occupation == "Diseñadora UX"
    assert user.bio == "Ordenada y tranquila, me encanta cocinar."


def test_update_profile_clears_optional_fields_when_omitted(
    db_session, make_user
):
    user = make_user("extra-fields-clear")
    user.age = 30
    user.occupation = "Ingeniero"
    user.bio = "Algo"
    db_session.commit()

    auth_service.update_profile(
        current_user=user,
        data=UpdateProfileRequest(
            first_name=user.first_name,
            last_name=user.last_name,
        ),
        db=db_session,
    )

    assert user.age is None
    assert user.occupation is None
    assert user.bio is None


def test_public_profile_reports_verified_from_email_flag(
    db_session, make_user
):
    viewer = make_user("viewer-verified")
    target = make_user("target-verified")
    target.is_email_verified = True
    db_session.commit()

    profile = user_service.build_public_profile(db_session, target, viewer)

    assert profile.is_verified is True


def test_public_profile_reports_not_online_without_activity(
    db_session, make_user
):
    viewer = make_user("viewer-offline")
    target = make_user("target-offline")

    profile = user_service.build_public_profile(db_session, target, viewer)

    assert profile.is_online is False


def test_public_profile_reports_online_with_recent_activity(
    db_session, make_user
):
    viewer = make_user("viewer-online")
    target = make_user("target-online")
    target.last_active_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db_session.commit()

    profile = user_service.build_public_profile(db_session, target, viewer)

    assert profile.is_online is True


def test_public_profile_reports_offline_after_threshold(
    db_session, make_user
):
    viewer = make_user("viewer-stale")
    target = make_user("target-stale")
    target.last_active_at = (
        datetime.now(timezone.utc) - ONLINE_THRESHOLD - timedelta(minutes=1)
    )
    db_session.commit()

    profile = user_service.build_public_profile(db_session, target, viewer)

    assert profile.is_online is False


def test_public_profile_exposes_age_occupation_bio(db_session, make_user):
    viewer = make_user("viewer-extra")
    target = make_user("target-extra")
    target.age = 24
    target.occupation = "Estudiante de Máster"
    target.bio = "Busco piso cerca de la uni."
    db_session.commit()

    profile = user_service.build_public_profile(db_session, target, viewer)

    assert profile.age == 24
    assert profile.occupation == "Estudiante de Máster"
    assert profile.bio == "Busco piso cerca de la uni."


def test_get_current_user_sets_last_active_at_on_first_call(
    db_session, make_user
):
    user = make_user("activity-first")
    assert user.last_active_at is None

    result = _call_get_current_user(db_session, user)

    assert result.last_active_at is not None


def test_get_current_user_throttles_repeated_writes(db_session, make_user):
    user = make_user("activity-throttle")

    first_call = _call_get_current_user(db_session, user)
    first_timestamp = first_call.last_active_at

    second_call = _call_get_current_user(db_session, user)

    assert second_call.last_active_at == first_timestamp


def test_get_current_user_updates_after_throttle_window(db_session, make_user):
    user = make_user("activity-window")
    user.last_active_at = (
        datetime.now(timezone.utc) - _LAST_ACTIVE_WRITE_THROTTLE - timedelta(seconds=1)
    )
    db_session.commit()
    stale_timestamp = user.last_active_at

    result = _call_get_current_user(db_session, user)

    assert result.last_active_at > stale_timestamp


def _call_get_current_user(db_session, user):
    from app.core.jwt import create_access_token

    class _Credentials:
        credentials = create_access_token(str(user.id))

    return get_current_user(credentials=_Credentials(), db=db_session)
