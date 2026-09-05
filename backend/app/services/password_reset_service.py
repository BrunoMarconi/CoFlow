from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import BackgroundTasks
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import PASSWORD_RESET_EXPIRY_MINUTES
from app.core.security import hash_password
from app.database.models.password_reset_token import PasswordResetToken
from app.database.models.user import User
from app.services.email_service import send_password_reset_email

GENERIC_REQUEST_MESSAGE = (
    "Si existe una cuenta con ese correo, recibirás un enlace para restablecer la contraseña."
)
REQUEST_MIN_INTERVAL_SECONDS = 60
REQUEST_MAX_PER_HOUR = 5
IP_MAX_PER_HOUR = 20


class PasswordResetError(Exception):
    def __init__(self, code: str):
        self.code = code
        super().__init__(code)


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()


def _invalidate_active_tokens(db: Session, user_id) -> None:
    now = datetime.now(timezone.utc)
    for token in (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.user_id == user_id)
        .filter(PasswordResetToken.used_at.is_(None))
        .all()
    ):
        token.used_at = now


def _can_send(db: Session, user_id, ip_hash: str | None) -> bool:
    now = datetime.now(timezone.utc)
    last = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.user_id == user_id)
        .order_by(PasswordResetToken.created_at.desc())
        .first()
    )
    if last and now - last.created_at < timedelta(seconds=REQUEST_MIN_INTERVAL_SECONDS):
        return False

    hour_ago = now - timedelta(hours=1)
    if (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.user_id == user_id)
        .filter(PasswordResetToken.created_at >= hour_ago)
        .count()
        >= REQUEST_MAX_PER_HOUR
    ):
        return False
    if ip_hash and (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.requested_ip_hash == ip_hash)
        .filter(PasswordResetToken.created_at >= hour_ago)
        .count()
        >= IP_MAX_PER_HOUR
    ):
        return False
    return True


def request_reset(
    db: Session,
    email: str,
    background_tasks: BackgroundTasks,
    *,
    ip_hash: str | None = None,
) -> str | None:
    user = (
        db.query(User)
        .filter(func.lower(User.email) == email.strip().lower())
        .first()
    )
    # Las cuentas exclusivamente Google no tienen una contraseña que recuperar.
    # La respuesta sigue siendo idéntica para impedir enumeración de cuentas.
    if user is None or user.password_hash is None or not _can_send(db, user.id, ip_hash):
        return None

    _invalidate_active_tokens(db, user.id)
    raw_token = secrets.token_urlsafe(32)
    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=hash_token(raw_token),
            expires_at=datetime.now(timezone.utc)
            + timedelta(minutes=PASSWORD_RESET_EXPIRY_MINUTES),
            requested_ip_hash=ip_hash,
        )
    )
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    background_tasks.add_task(
        send_password_reset_email,
        to_email=user.email,
        first_name=user.first_name,
        raw_token=raw_token,
        expiry_minutes=PASSWORD_RESET_EXPIRY_MINUTES,
    )
    return raw_token


def reset_password(db: Session, raw_token: str, new_password: str) -> None:
    token = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token_hash == hash_token(raw_token))
        .first()
    )
    if token is None:
        raise PasswordResetError("INVALID_TOKEN")
    if token.used_at is not None:
        raise PasswordResetError("TOKEN_ALREADY_USED")
    if token.expires_at < datetime.now(timezone.utc):
        raise PasswordResetError("TOKEN_EXPIRED")

    user = db.query(User).filter(User.id == token.user_id).first()
    if user is None:
        raise PasswordResetError("INVALID_TOKEN")

    token.used_at = datetime.now(timezone.utc)
    user.password_hash = hash_password(new_password)
    user.auth_version += 1
    _invalidate_active_tokens(db, user.id)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
