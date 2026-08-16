"""Tests HTTP reales (TestClient) para /auth/register y /auth/login —
complementan los tests de servicio ya existentes (test_auth_service_
feature_flag.py, test_require_verified_email.py) verificando el
contrato HTTP completo: el payload real que envía el frontend, los
códigos de estado, y el cuerpo JSON de la respuesta."""

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.database.session import get_db
from app.main import app


@pytest.fixture(autouse=True)
def _clear_dependency_overrides():
    yield
    app.dependency_overrides.clear()

# Payload con exactamente la forma que envía
# frontend/src/app/(auth)/register/page.tsx vía
# frontend/src/services/auth.ts (first_name, last_name, email, password).
FRONTEND_REGISTER_PAYLOAD = {
    "first_name": "Ada",
    "last_name": "Lovelace",
    "email": "ada.http.test@example.com",
    "password": "password123",
}


def _client(db_session) -> TestClient:
    app.dependency_overrides[get_db] = lambda: db_session
    return TestClient(app)


def test_register_with_real_frontend_payload_succeeds(db_session):
    client = _client(db_session)

    with patch("app.services.auth_service.EMAIL_VERIFICATION_ENABLED", False):
        response = client.post("/auth/register", json=FRONTEND_REGISTER_PAYLOAD)

    assert response.status_code == 200
    assert response.json() == {
        "message": "Cuenta creada correctamente.",
        "debug_token": None,
    }


def test_register_duplicate_email_returns_409(db_session):
    client = _client(db_session)

    with patch("app.services.auth_service.EMAIL_VERIFICATION_ENABLED", False):
        first = client.post("/auth/register", json=FRONTEND_REGISTER_PAYLOAD)
        assert first.status_code == 200

        second = client.post("/auth/register", json=FRONTEND_REGISTER_PAYLOAD)

    assert second.status_code == 409
    assert "detail" in second.json()


def test_register_missing_field_returns_422_not_500(db_session):
    client = _client(db_session)

    incomplete_payload = {
        "first_name": "Ada",
        "email": "incomplete.http.test@example.com",
        "password": "password123",
    }

    response = client.post("/auth/register", json=incomplete_payload)

    assert response.status_code == 422
    body = response.json()
    assert "detail" in body
    # El cuerpo de error de FastAPI/Pydantic para un 422 identifica el
    # campo exacto que falta — nunca un traceback ni un 500.
    assert any(
        "last_name" in str(error.get("loc", ""))
        for error in body["detail"]
    )


def test_login_with_correct_credentials_returns_token_and_flags(db_session):
    client = _client(db_session)

    with patch("app.services.auth_service.EMAIL_VERIFICATION_ENABLED", False):
        register_response = client.post(
            "/auth/register", json=FRONTEND_REGISTER_PAYLOAD
        )
        assert register_response.status_code == 200

        login_response = client.post(
            "/auth/login",
            json={
                "email": FRONTEND_REGISTER_PAYLOAD["email"],
                "password": FRONTEND_REGISTER_PAYLOAD["password"],
            },
        )

    assert login_response.status_code == 200
    body = login_response.json()
    assert body["token_type"] == "bearer"
    assert isinstance(body["access_token"], str) and body["access_token"]
    # Con la cuenta creada mientras la flag estaba desactivada, debe
    # quedar verificada automáticamente.
    assert body["is_email_verified"] is True
    assert body["email_verification_enabled"] is False


def test_login_with_wrong_password_returns_401_not_500(db_session):
    client = _client(db_session)

    with patch("app.services.auth_service.EMAIL_VERIFICATION_ENABLED", False):
        client.post("/auth/register", json=FRONTEND_REGISTER_PAYLOAD)

        response = client.post(
            "/auth/login",
            json={
                "email": FRONTEND_REGISTER_PAYLOAD["email"],
                "password": "wrong-password",
            },
        )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid credentials"}


def test_login_with_unknown_email_returns_401_not_500(db_session):
    client = _client(db_session)

    response = client.post(
        "/auth/login",
        json={"email": "does-not-exist@example.com", "password": "whatever123"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid credentials"}


def test_login_full_response_body_matches_login_response_schema(db_session):
    """Reproduce exactamente el flujo pedido: crear usuario -> login
    correcto -> validar el JSON completo (no solo campos sueltos) ->
    comprobar is_email_verified -> confirmar que nunca es un 500.

    Este test fija por contrato las claves exactas que devuelve
    LoginResponse. Si algún día login() empezara a servir (o a
    intentar servir) columnas que no existen en la tabla real —como
    pasó en producción al desplegar el modelo de avatares antes de
    aplicar su migración— este test seguiría en verde porque usa una
    base de datos con el esquema al día; la protección real contra esa
    clase de fallo es de infraestructura (migración aplicada antes que
    el código que la requiere), no algo que un test unitario pueda
    sustituir. Lo que este test sí garantiza es el contrato exacto de
    /auth/login cuando el esquema está correcto.
    """
    client = _client(db_session)

    with patch("app.services.auth_service.EMAIL_VERIFICATION_ENABLED", False):
        register_response = client.post(
            "/auth/register", json=FRONTEND_REGISTER_PAYLOAD
        )
        assert register_response.status_code == 200

        login_response = client.post(
            "/auth/login",
            json={
                "email": FRONTEND_REGISTER_PAYLOAD["email"],
                "password": FRONTEND_REGISTER_PAYLOAD["password"],
            },
        )

    assert login_response.status_code != 500
    assert login_response.status_code == 200

    body = login_response.json()

    assert set(body.keys()) == {
        "access_token",
        "token_type",
        "is_email_verified",
        "email_verification_enabled",
    }
    assert isinstance(body["access_token"], str) and len(body["access_token"]) > 0
    assert body["token_type"] == "bearer"
    assert body["is_email_verified"] is True
    assert body["email_verification_enabled"] is False


def test_register_does_not_send_email_when_flag_disabled(db_session):
    client = _client(db_session)

    with patch("app.services.auth_service.EMAIL_VERIFICATION_ENABLED", False), patch(
        "app.services.auth_service.request_verification_email"
    ) as mocked_request_verification_email:
        response = client.post("/auth/register", json=FRONTEND_REGISTER_PAYLOAD)

    assert response.status_code == 200
    mocked_request_verification_email.assert_not_called()


def test_update_profile_returns_updated_user_not_500(db_session):
    """Regresión: AuthService.update_profile devolvía un dict plano
    ({"message": ...}) en vez del User actualizado, lo que rompía la
    validación contra response_model=UserResponse y convertía CADA
    llamada a PUT /auth/me en un 500 — endpoint usado por onboarding,
    perfil/editar, perfil/preferencias y propietarios/perfil. Los tests
    de servicio existentes (test_user_profile_extra_fields.py) no lo
    detectaban porque llaman a update_profile() directamente, sin pasar
    por la capa HTTP donde FastAPI aplica esa validación."""
    client = _client(db_session)

    register_payload = {
        "first_name": "Grace",
        "last_name": "Hopper",
        "email": "grace.http.test@example.com",
        "password": "password123",
        "birth_date": "1995-01-01",
        "terms_accepted": True,
    }

    with patch("app.services.auth_service.EMAIL_VERIFICATION_ENABLED", False):
        register_response = client.post("/auth/register", json=register_payload)
        assert register_response.status_code == 200
        token = register_response.json()["access_token"]

        response = client.put(
            "/auth/me",
            json={
                "first_name": "Grace",
                "last_name": "Hopper",
                "occupation": "Ingeniera",
                "rental_budget": 500,
            },
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["occupation"] == "Ingeniera"
    assert body["rental_budget"] == 500
