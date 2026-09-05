from datetime import datetime, timedelta, timezone
import os

from jose import jwt, JWTError

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
_ACCESS_TOKEN_EXPIRE_MINUTES_RAW = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")

if not SECRET_KEY or not ALGORITHM or not _ACCESS_TOKEN_EXPIRE_MINUTES_RAW:
    raise RuntimeError(
        "SECRET_KEY, ALGORITHM y ACCESS_TOKEN_EXPIRE_MINUTES son "
        "variables de entorno obligatorias. Defínelas en backend/.env "
        "(desarrollo) o en las variables de entorno del servicio "
        "(despliegue) antes de arrancar la aplicación."
    )

ACCESS_TOKEN_EXPIRE_MINUTES = int(_ACCESS_TOKEN_EXPIRE_MINUTES_RAW)


def create_access_token(user_id: str, auth_version: int = 0, session_id: str | None = None):
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": user_id,
        "ver": auth_version,
        "exp": expire
    }
    if session_id:
        payload["sid"] = session_id

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def decode_access_token(token: str):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        return payload

    except JWTError:
        return None
