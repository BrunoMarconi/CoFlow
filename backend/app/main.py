import mimetypes
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

# El módulo estándar mimetypes no trae ".webp" registrado en todas las
# versiones/plataformas de Python (confirmado ausente en 3.10, el
# entorno de desarrollo local) — sin esto, StaticFiles sirve cada
# imagen guardada en disco (todas se normalizan a WebP, ver
# storage_service.validate_image) con Content-Type
# "application/octet-stream" en vez de "image/webp", y el navegador
# descarta el contenido en vez de pintarlo: un hueco en blanco, no un
# icono de imagen rota, porque la petición sí devuelve 200. Registrarlo
# explícitamente hace el comportamiento correcto sin depender de la
# versión de Python del despliegue.
mimetypes.add_type("image/webp", ".webp")

from app.api.auth import router as auth_router
from app.api.routes import (
    applications,
    bank_connections,
    communities,
    connections,
    financial_analysis,
    invitations,
    legal,
    notifications,
    onboarding,
    owner_properties,
    owners,
    property_amenities,
    public_solvency_passports,
    solvency_passports,
    users,
)
from app.core.config import CORS_ALLOWED_ORIGINS, FRONTEND_URL
from app.services import storage_service
from fastapi.middleware.cors import CORSMiddleware

# Las 5 variables R2_* ya están configuradas en Render (confirmado
# 2026-08-16): storage_service.upload_file() ya sube ahí las imágenes
# nuevas en producción, no a disco local. Esta comprobación es la red
# de seguridad para que, si en un despliegue futuro alguna de esas 5
# variables faltase o tuviera un error, el servicio se niegue a
# arrancar en vez de caer silenciosamente a disco local efímero (que
# es justo como se perdían imágenes antes de tener R2).
storage_service.ensure_persistent_storage_configured()

app = FastAPI(
    title="CoFlow API",
    version="1.0.0"
)


def _build_allowed_origins() -> list[str]:
    # localhost siempre permitido para no romper el desarrollo local,
    # incluso cuando se apunta un frontend local a un backend desplegado.
    origins = {"http://localhost:3000", "http://127.0.0.1:3000"}

    if FRONTEND_URL:
        origins.add(FRONTEND_URL)

    for origin in CORS_ALLOWED_ORIGINS.split(","):
        origin = origin.strip()
        if origin:
            origins.add(origin)

    return list(origins)


app.add_middleware(
    CORSMiddleware,
    allow_origins=_build_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(
    onboarding.router,
    prefix="/onboarding",
    tags=["Onboarding"],
)
app.include_router(
    communities.router,
    prefix="/communities",
    tags=["Communities"],
)
app.include_router(
    users.router,
    prefix="/users",
    tags=["Users"],
)
app.include_router(
    invitations.router,
    prefix="/invitations",
    tags=["Invitations"],
)
app.include_router(
    legal.router,
    prefix="/legal",
    tags=["Legal"],
)
app.include_router(
    applications.router,
    prefix="/applications",
    tags=["Applications"],
)
app.include_router(
    connections.router,
    prefix="/connections",
    tags=["Connections"],
)
app.include_router(
    notifications.router,
    prefix="/notifications",
    tags=["Notifications"],
)
app.include_router(
    owners.router,
    prefix="/owners",
    tags=["Owners"],
)
app.include_router(
    owner_properties.router,
    prefix="/owner/properties",
    tags=["Owner Properties"],
)
app.include_router(
    property_amenities.router,
    prefix="/property-amenities",
    tags=["Property Amenities"],
)
app.include_router(
    bank_connections.router,
    prefix="/bank-connections",
    tags=["Bank Connections"],
)
app.include_router(
    financial_analysis.router,
    prefix="/financial-analysis",
    tags=["Financial Analysis"],
)
app.include_router(
    solvency_passports.router,
    prefix="/solvency-passports",
    tags=["Solvency Passports"],
)
app.include_router(
    public_solvency_passports.router,
    prefix="/public/solvency-passports",
    tags=["Solvency Passports (Public)"],
)

# Almacenamiento de imágenes pensado para desarrollo local. Con las 5
# variables R2_* ya configuradas en Render (ver comentario más arriba),
# las imágenes NUEVAS en producción ya no pasan por aquí — pero este
# mount sigue activo y sirviendo cualquier imagen antigua que se
# hubiera subido antes de configurar R2 (si la hubo), así que el fix de
# Content-Type de mimetypes.add_type() de arriba sigue teniendo valor
# también en producción para ese caso, no solo en desarrollo.
MEDIA_ROOT = Path(__file__).resolve().parent.parent / "media"
MEDIA_ROOT.mkdir(exist_ok=True)
app.mount("/media", StaticFiles(directory=str(MEDIA_ROOT)), name="media")


@app.get("/")
def root():
    return {"message": "CoFlow API"}


@app.get("/health")
def health():
    return {"status": "ok"}
