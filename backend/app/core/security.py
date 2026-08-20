from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str | None) -> bool:
    # None pasa aquí cuando la cuenta se creó con "Iniciar sesión con
    # Google" y nunca se le puso una contraseña propia — sin este
    # chequeo, pwd_context.verify(password, None) lanza en vez de
    # simplemente fallar la verificación como cualquier contraseña
    # incorrecta.
    if password_hash is None:
        return False
    return pwd_context.verify(password, password_hash)