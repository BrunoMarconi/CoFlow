from cryptography.fernet import Fernet, InvalidToken

from app.core.config import BANK_TOKEN_ENCRYPTION_KEY

_fernet: Fernet | None = None


def _get_fernet() -> Fernet:
    global _fernet

    if _fernet is not None:
        return _fernet

    if not BANK_TOKEN_ENCRYPTION_KEY:
        raise RuntimeError(
            "BANK_TOKEN_ENCRYPTION_KEY es una variable de entorno "
            "obligatoria para cifrar tokens bancarios. Defínela en "
            "backend/.env (desarrollo) o en las variables de entorno del "
            "servicio (despliegue). Genera un valor con: "
            "python -c \"from cryptography.fernet import Fernet; "
            "print(Fernet.generate_key().decode())\""
        )

    try:
        _fernet = Fernet(BANK_TOKEN_ENCRYPTION_KEY.encode())
    except (ValueError, TypeError) as exc:
        raise RuntimeError(
            "BANK_TOKEN_ENCRYPTION_KEY no es una clave Fernet válida. "
            "Genera una con: python -c \"from cryptography.fernet import "
            "Fernet; print(Fernet.generate_key().decode())\""
        ) from exc

    return _fernet


def encrypt_token(plaintext: str) -> str:
    return _get_fernet().encrypt(plaintext.encode()).decode()


def decrypt_token(ciphertext: str) -> str:
    try:
        return _get_fernet().decrypt(ciphertext.encode()).decode()
    except InvalidToken as exc:
        raise RuntimeError("No se pudo descifrar el token bancario.") from exc
