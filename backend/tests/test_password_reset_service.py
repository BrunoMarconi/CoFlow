from datetime import datetime, timedelta, timezone

import pytest
from fastapi import BackgroundTasks

from app.core.security import verify_password
from app.database.models.password_reset_token import PasswordResetToken
from app.services.password_reset_service import (
    PasswordResetError,
    hash_token,
    request_reset,
    reset_password,
)


def test_request_and_reset_password(db_session, make_user):
    user = make_user("passwordreset")
    user.password_hash = "$2b$12$Jq7d9HjYw7f0MTCopONa2OUowgAu.MKo4vyPPKTJIhBDgqkVAD9KG"
    db_session.commit()

    raw_token = request_reset(db_session, user.email, BackgroundTasks())
    assert raw_token is not None

    previous_version = user.auth_version
    reset_password(db_session, raw_token, "UnaClaveNueva123")

    assert verify_password("UnaClaveNueva123", user.password_hash)
    assert user.auth_version == previous_version + 1


def test_reset_token_is_single_use(db_session, make_user):
    user = make_user("passwordsingleuse")
    raw_token = request_reset(db_session, user.email, BackgroundTasks())
    reset_password(db_session, raw_token, "UnaClaveNueva123")

    with pytest.raises(PasswordResetError) as exc_info:
        reset_password(db_session, raw_token, "OtraClaveNueva123")
    assert exc_info.value.code == "TOKEN_ALREADY_USED"


def test_expired_reset_token_fails(db_session, make_user):
    user = make_user("passwordexpired")
    raw_token = request_reset(db_session, user.email, BackgroundTasks())
    token = (
        db_session.query(PasswordResetToken)
        .filter(PasswordResetToken.token_hash == hash_token(raw_token))
        .first()
    )
    token.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db_session.commit()

    with pytest.raises(PasswordResetError) as exc_info:
        reset_password(db_session, raw_token, "UnaClaveNueva123")
    assert exc_info.value.code == "TOKEN_EXPIRED"


def test_unknown_email_does_not_create_token(db_session):
    result = request_reset(
        db_session, "not-registered@example.com", BackgroundTasks()
    )
    assert result is None
