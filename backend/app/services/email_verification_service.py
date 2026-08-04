"""Tokens de verificación de email — un solo uso, hash sha256, con
límites de reenvío. No se guarda ningún token en claro; no se loguea
ningún token ni URL completa aquí (eso vive en email_service.py, que
tampoco lo hace)."""

from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import BackgroundTasks
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import EMAIL_VERIFICATION_EXPIRY_MINUTES
from app.database.models.email_verification_token import EmailVerificationToken
from app.database.models.user import User
from app.services.email_service import send_verification_email

RESEND_MIN_INTERVAL_SECONDS = 60
RESEND_MAX_PER_HOUR = 5
# No fijado por el encargo; límite razonable documentado para frenar
# abuso desde una misma IP contra múltiples cuentas.
IP_MAX_PER_HOUR = 20

GENERIC_RESEND_MESSAGE = (
    "Si existe una cuenta pendiente de verificar, enviaremos un nuevo correo."
)


class VerificationError(Exception):
    """code es uno de: INVALID_TOKEN, TOKEN_EXPIRED, TOKEN_ALREADY_USED."""

    def __init__(self, code: str):
        self.code = code
        super().__init__(code)


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()


def hash_ip(ip: str | None) -> str | None:
    if not ip:
        return None
    return hashlib.sha256(ip.encode()).hexdigest()


def _invalidate_active_tokens(db: Session, user_id) -> None:
    now = datetime.now(timezone.utc)
    active_tokens = (
        db.query(EmailVerificationToken)
        .filter(EmailVerificationToken.user_id == user_id)
        .filter(EmailVerificationToken.used_at.is_(None))
        .filter(EmailVerificationToken.expires_at > now)
        .all()
    )
    for token in active_tokens:
        token.used_at = now


def create_token(db: Session, user: User, *, ip_hash: str | None = None) -> str:
    """Crea y persiste un nuevo token, invalidando los activos previos
    del usuario. Devuelve el token en claro — solo existe en memoria
    aquí, nunca se persiste."""
    now = datetime.now(timezone.utc)

    previous = (
        db.query(EmailVerificationToken)
        .filter(EmailVerificationToken.user_id == user.id)
        .order_by(EmailVerificationToken.created_at.desc())
        .first()
    )
    resend_count = (previous.resend_count + 1) if previous else 0

    _invalidate_active_tokens(db, user.id)

    raw_token = secrets.token_urlsafe(32)
    token = EmailVerificationToken(
        user_id=user.id,
        token_hash=hash_token(raw_token),
        expires_at=now + timedelta(minutes=EMAIL_VERIFICATION_EXPIRY_MINUTES),
        requested_ip_hash=ip_hash,
        resend_count=resend_count,
    )
    db.add(token)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return raw_token


def request_verification_email(
    db: Session,
    user: User,
    background_tasks: BackgroundTasks,
    *,
    ip_hash: str | None = None,
) -> str:
    """Crea el token y agenda el envío en background. El caller ya debe
    haber decidido que procede enviarlo."""
    raw_token = create_token(db, user, ip_hash=ip_hash)

    background_tasks.add_task(
        send_verification_email,
        to_email=user.email,
        first_name=user.first_name,
        raw_token=raw_token,
        expiry_minutes=EMAIL_VERIFICATION_EXPIRY_MINUTES,
    )

    return raw_token


def verify(db: Session, raw_token: str) -> User:
    token_hash = hash_token(raw_token)
    token = (
        db.query(EmailVerificationToken)
        .filter(EmailVerificationToken.token_hash == token_hash)
        .first()
    )

    if token is None:
        raise VerificationError("INVALID_TOKEN")

    if token.used_at is not None:
        raise VerificationError("TOKEN_ALREADY_USED")

    if token.expires_at < datetime.now(timezone.utc):
        raise VerificationError("TOKEN_EXPIRED")

    user = db.query(User).filter(User.id == token.user_id).first()
    if user is None:
        raise VerificationError("INVALID_TOKEN")

    now = datetime.now(timezone.utc)
    user.is_email_verified = True
    user.email_verified_at = now
    token.used_at = now
    _invalidate_active_tokens(db, user.id)

    try:
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise

    return user


def _can_send(db: Session, user: User, ip_hash: str | None) -> bool:
    now = datetime.now(timezone.utc)

    last = (
        db.query(EmailVerificationToken)
        .filter(EmailVerificationToken.user_id == user.id)
        .order_by(EmailVerificationToken.created_at.desc())
        .first()
    )
    if last is not None and (now - last.created_at) < timedelta(
        seconds=RESEND_MIN_INTERVAL_SECONDS
    ):
        return False

    hour_ago = now - timedelta(hours=1)
    account_count_last_hour = (
        db.query(EmailVerificationToken)
        .filter(EmailVerificationToken.user_id == user.id)
        .filter(EmailVerificationToken.created_at >= hour_ago)
        .count()
    )
    if account_count_last_hour >= RESEND_MAX_PER_HOUR:
        return False

    if ip_hash:
        ip_count_last_hour = (
            db.query(EmailVerificationToken)
            .filter(EmailVerificationToken.requested_ip_hash == ip_hash)
            .filter(EmailVerificationToken.created_at >= hour_ago)
            .count()
        )
        if ip_count_last_hour >= IP_MAX_PER_HOUR:
            return False

    return True


def resend_verification(
    db: Session,
    email: str,
    background_tasks: BackgroundTasks,
    *,
    ip_hash: str | None = None,
) -> str | None:
    """Nunca lanza, nunca revela si la cuenta existe o su estado — el
    caller siempre responde el mismo mensaje genérico
    independientemente del valor devuelto. Devuelve el token en claro
    únicamente cuando se generó uno (para EMAIL_VERIFICATION_TEST_MODE);
    el caller decide si exponerlo."""
    normalized_email = email.strip().lower()

    user = (
        db.query(User).filter(func.lower(User.email) == normalized_email).first()
    )

    if user is None or user.is_email_verified:
        return None

    if not _can_send(db, user, ip_hash):
        return None

    return request_verification_email(db, user, background_tasks, ip_hash=ip_hash)
