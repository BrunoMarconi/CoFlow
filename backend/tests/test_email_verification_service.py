from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from fastapi import BackgroundTasks

from app.database.models.email_verification_token import EmailVerificationToken
from app.services import email_service
from app.services.email_verification_service import (
    VerificationError,
    create_token,
    hash_token,
    request_verification_email,
    resend_verification,
    verify,
)


def test_new_user_starts_unverified(make_user):
    user = make_user("unverified")
    assert user.is_email_verified is False
    assert user.email_verified_at is None


def test_valid_token_verifies_user(db_session, make_user):
    user = make_user("valid")
    raw_token = create_token(db_session, user)

    verified = verify(db_session, raw_token)

    assert verified.is_email_verified is True
    assert verified.email_verified_at is not None


def test_invalid_token_fails(db_session, make_user):
    make_user("invalidtoken")

    with pytest.raises(VerificationError) as exc_info:
        verify(db_session, "not-a-real-token")

    assert exc_info.value.code == "INVALID_TOKEN"


def test_expired_token_fails(db_session, make_user):
    user = make_user("expired")
    raw_token = create_token(db_session, user)

    token_row = (
        db_session.query(EmailVerificationToken)
        .filter(EmailVerificationToken.token_hash == hash_token(raw_token))
        .first()
    )
    token_row.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db_session.commit()

    with pytest.raises(VerificationError) as exc_info:
        verify(db_session, raw_token)

    assert exc_info.value.code == "TOKEN_EXPIRED"


def test_used_token_cannot_be_reused(db_session, make_user):
    user = make_user("reused")
    raw_token = create_token(db_session, user)

    verify(db_session, raw_token)

    with pytest.raises(VerificationError) as exc_info:
        verify(db_session, raw_token)

    assert exc_info.value.code == "TOKEN_ALREADY_USED"


def test_new_token_invalidates_previous(db_session, make_user):
    user = make_user("invalidates")
    first_token = create_token(db_session, user)
    create_token(db_session, user)

    with pytest.raises(VerificationError) as exc_info:
        verify(db_session, first_token)

    assert exc_info.value.code == "TOKEN_ALREADY_USED"


def test_resend_does_not_enumerate_users(db_session, make_user):
    make_user("existsresend")
    background_tasks = BackgroundTasks()

    existing_result = resend_verification(
        db_session, "pytest_existsresend_0@example.com", background_tasks
    )
    nonexistent_result = resend_verification(
        db_session, "definitely-not-registered@example.com", background_tasks
    )

    # Ambos casos son indistinguibles desde fuera: el caller siempre
    # responde el mismo mensaje genérico sin mirar el valor devuelto.
    assert existing_result is not None
    assert nonexistent_result is None


def test_resend_skips_already_verified_user(db_session, make_user):
    user = make_user("alreadyverified")
    raw_token = create_token(db_session, user)
    verify(db_session, raw_token)

    background_tasks = BackgroundTasks()
    result = resend_verification(
        db_session, user.email, background_tasks
    )

    assert result is None


def test_resend_rate_limited_per_minute(db_session, make_user):
    user = make_user("ratelimitminute")
    background_tasks = BackgroundTasks()

    first = resend_verification(db_session, user.email, background_tasks)
    second = resend_verification(db_session, user.email, background_tasks)

    assert first is not None
    assert second is None  # menos de 60s después


def test_resend_rate_limited_per_hour(db_session, make_user):
    user = make_user("ratelimithour")
    background_tasks = BackgroundTasks()

    now = datetime.now(timezone.utc)
    for i in range(5):
        db_session.add(
            EmailVerificationToken(
                user_id=user.id,
                token_hash=f"fakehash{i}",
                expires_at=now + timedelta(minutes=30),
                created_at=now - timedelta(minutes=10 + i),
                used_at=now - timedelta(minutes=9 + i),
            )
        )
    db_session.commit()

    result = resend_verification(db_session, user.email, background_tasks)
    assert result is None  # ya hay 5 en la última hora


def test_resend_rate_limited_per_ip(db_session, make_user):
    background_tasks = BackgroundTasks()
    ip_hash = "same-ip-hash-for-test"

    # Simula 20 envíos previos ya realizados desde esa IP (a cualquier
    # cuenta) dentro de la última hora.
    now = datetime.now(timezone.utc)
    extra_user = make_user("ipfloodextra")
    for i in range(20):
        db_session.add(
            EmailVerificationToken(
                user_id=extra_user.id,
                token_hash=f"ipfakehash{i}",
                expires_at=now + timedelta(minutes=30),
                created_at=now - timedelta(minutes=1),
                requested_ip_hash=ip_hash,
            )
        )
    db_session.commit()

    blocked_user = make_user("ipfloodblocked")
    blocked_result = resend_verification(
        db_session, blocked_user.email, background_tasks, ip_hash=ip_hash
    )
    assert blocked_result is None

    # Una cuenta distinta, misma hora, pero SIN esa IP no debe verse
    # afectada por el límite de IP.
    unaffected_user = make_user("ipfloodunaffected")
    unaffected_result = resend_verification(
        db_session, unaffected_user.email, background_tasks, ip_hash="different-ip-hash"
    )
    assert unaffected_result is not None


def test_email_is_normalized_on_resend(db_session, make_user):
    user = make_user("normalize")
    background_tasks = BackgroundTasks()

    result = resend_verification(
        db_session, f"  {user.email.upper()}  ", background_tasks
    )

    assert result is not None


def test_resend_failure_does_not_delete_user(db_session, make_user):
    user = make_user("resendfails")

    with patch("app.services.email_service.resend") as mock_resend:
        mock_resend.Emails.send.side_effect = Exception("simulated Resend outage")
        with patch("app.services.email_service.RESEND_API_KEY", "fake-key"):
            with patch("app.services.email_service.EMAIL_DELIVERY_MODE", "resend"):
                # No debe lanzar aunque el SDK falle.
                email_service.send_verification_email(
                    to_email=user.email,
                    first_name=user.first_name,
                    raw_token="irrelevant",
                    expiry_minutes=30,
                )

    still_there = db_session.get(type(user), user.id)
    assert still_there is not None
    assert still_there.email == user.email
