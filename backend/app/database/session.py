import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL es una variable de entorno obligatoria. "
        "Defínela en backend/.env (desarrollo) o en las variables de "
        "entorno del servicio (despliegue) antes de arrancar la "
        "aplicación."
    )

# pool_pre_ping evita usar una conexión que Neon (Postgres serverless)
# ya cerró por inactividad — sin esto, la primera query tras un rato
# sin tráfico podía fallar o tardar de más al reintentar. pool_recycle
# recicla conexiones antes de que el propio Neon las corte por su cuenta.
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=280)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()