"""Tokens públicos del Pasaporte de Solvencia — derivados, no persistidos.

El token que valida un enlace público NUNCA se guarda en la base de
datos (ni en claro, ni cifrado, ni como hash): se deriva siempre bajo
demanda con HMAC-SHA256 a partir de PASSPORT_SHARE_SECRET (solo en
variables de entorno) + el id del pasaporte + su `share_nonce` +
`share_token_version`. Regenerar el enlace rota `share_nonce`, lo que
cambia el HMAC resultante e invalida cualquier enlace anterior sin tener
que revocar ni versionar nada más.
"""

import hashlib
import hmac
import secrets

from app.core.config import FRONTEND_URL, PASSPORT_SHARE_SECRET


def _require_secret() -> str:
    if not PASSPORT_SHARE_SECRET:
        raise RuntimeError(
            "PASSPORT_SHARE_SECRET es una variable de entorno obligatoria "
            "para generar enlaces verificables de pasaportes de solvencia. "
            "Defínela en backend/.env (desarrollo) o en las variables de "
            "entorno del servicio (despliegue). Genera un valor con: "
            "python -c \"import secrets; print(secrets.token_hex(32))\""
        )
    return PASSPORT_SHARE_SECRET


def generate_public_id() -> str:
    """No secuencial, legible. 48 bits de aleatoriedad (12 hex)."""
    return f"SP-{secrets.token_hex(6).upper()}"


def generate_share_nonce() -> str:
    return secrets.token_hex(16)


def compute_share_token(
    passport_id: str, share_nonce: str, share_token_version: int
) -> str:
    secret = _require_secret()
    message = f"{passport_id}:{share_nonce}:{share_token_version}".encode()
    return hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()


def verify_share_token(
    candidate: str, passport_id: str, share_nonce: str, share_token_version: int
) -> bool:
    if not candidate:
        return False
    expected = compute_share_token(passport_id, share_nonce, share_token_version)
    return secrets.compare_digest(candidate, expected)


def build_share_url(public_id: str, token: str) -> str:
    base = FRONTEND_URL or "http://localhost:3000"
    return f"{base}/verificar/pasaporte/{public_id}?token={token}"
