from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import EMAIL_VERIFICATION_ENABLED
from app.core.jwt import decode_access_token
from app.database.models.user import User
from app.database.models.auth_session import AuthSession
from app.database.session import get_db

security = HTTPBearer()

# Ventana mínima entre escrituras de last_active_at: no hace falta
# actualizarlo en cada petición (varias por segundo en uso normal),
# solo lo suficiente para que "En línea" (ver user_service.is_online)
# sea razonablemente reciente sin generar un UPDATE por request.
_LAST_ACTIVE_WRITE_THROTTLE = timedelta(seconds=60)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):

    payload = decode_access_token(credentials.credentials)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    user = (
        db.query(User)
        .filter(User.id == payload["sub"])
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    if payload.get("ver", 0) != user.auth_version:
        raise HTTPException(
            status_code=401,
            detail="Session expired",
        )

    session_id = payload.get("sid")
    if session_id:
        auth_session = db.query(AuthSession).filter(AuthSession.id == session_id, AuthSession.user_id == user.id, AuthSession.revoked_at.is_(None)).first()
        if auth_session is None:
            raise HTTPException(status_code=401, detail="Session expired")
        now = datetime.now(timezone.utc)
        if now - auth_session.last_active_at > _LAST_ACTIVE_WRITE_THROTTLE:
            auth_session.last_active_at = now

    now = datetime.now(timezone.utc)

    if (
        user.last_active_at is None
        or now - user.last_active_at > _LAST_ACTIVE_WRITE_THROTTLE
    ):
        user.last_active_at = now
        db.commit()
        db.refresh(user)

    return user


def require_verified_email(
    current_user: User = Depends(get_current_user),
) -> User:
    """Igual que get_current_user, pero además exige email verificado.
    Úsala en acciones sensibles (crear comunidad, conectar banco,
    ejecutar análisis financiero, etc.) — nunca en
    login/logout/ver perfil propio/reenviar verificación/confirmar
    correo. Si EMAIL_VERIFICATION_ENABLED está desactivado (feature flag
    temporal), deja pasar a todo el mundo sin comprobar nada."""
    if not EMAIL_VERIFICATION_ENABLED:
        return current_user

    if not current_user.is_email_verified:
        raise HTTPException(
            status_code=403,
            detail={
                "code": "EMAIL_NOT_VERIFIED",
                "message": "Confirma tu correo para continuar.",
            },
        )

    return current_user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Restringe herramientas internas a cuentas del equipo."""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
