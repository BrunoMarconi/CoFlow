from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.jwt import decode_access_token
from app.database.models.user import User
from app.database.session import get_db

security = HTTPBearer()


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

    return user


def require_verified_email(
    current_user: User = Depends(get_current_user),
) -> User:
    """Igual que get_current_user, pero además exige email verificado.
    Úsala en acciones sensibles (crear comunidad, conectar banco,
    ejecutar análisis financiero, emitir pasaporte, etc.) — nunca en
    login/logout/ver perfil propio/reenviar verificación/confirmar
    correo."""
    if not current_user.is_email_verified:
        raise HTTPException(
            status_code=403,
            detail={
                "code": "EMAIL_NOT_VERIFIED",
                "message": "Confirma tu correo para continuar.",
            },
        )

    return current_user