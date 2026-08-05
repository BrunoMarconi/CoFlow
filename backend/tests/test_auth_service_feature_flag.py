from unittest.mock import patch

from fastapi import BackgroundTasks

from app.database.models.email_verification_token import EmailVerificationToken
from app.schemas.auth import RegisterRequest
from app.services.auth_service import AuthService

auth_service = AuthService()


def _register_request(email: str) -> RegisterRequest:
    return RegisterRequest(
        first_name="Flag",
        last_name="Test",
        email=email,
        password="testpassword123",
    )


def test_register_creates_unverified_user_when_flag_enabled(db_session):
    from app.database.models.user import User

    background_tasks = BackgroundTasks()

    with patch("app.services.auth_service.EMAIL_VERIFICATION_ENABLED", True):
        response = auth_service.register(
            _register_request("flagon@example.com"),
            db_session,
            background_tasks,
        )

    assert "message" in response

    user = (
        db_session.query(User).filter(User.email == "flagon@example.com").first()
    )
    assert user is not None
    assert user.is_email_verified is False

    token_count = (
        db_session.query(EmailVerificationToken)
        .filter(EmailVerificationToken.user_id == user.id)
        .count()
    )
    assert token_count == 1


def test_register_creates_verified_user_when_flag_disabled(db_session):
    from app.database.models.user import User

    background_tasks = BackgroundTasks()

    with patch("app.services.auth_service.EMAIL_VERIFICATION_ENABLED", False):
        response = auth_service.register(
            _register_request("flagoff@example.com"),
            db_session,
            background_tasks,
        )

    assert response == {"message": "Cuenta creada correctamente."}

    user = (
        db_session.query(User)
        .filter(User.email == "flagoff@example.com")
        .first()
    )
    assert user is not None
    assert user.is_email_verified is True

    token_count = (
        db_session.query(EmailVerificationToken)
        .filter(EmailVerificationToken.user_id == user.id)
        .count()
    )
    assert token_count == 0
