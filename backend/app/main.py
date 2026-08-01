from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api.auth import router as auth_router
from app.api.routes import (
    applications,
    communities,
    connections,
    invitations,
    notifications,
    onboarding,
    owner_properties,
    owners,
    property_amenities,
    users,
)
from app.core.config import CORS_ALLOWED_ORIGINS, FRONTEND_URL
from fastapi.middleware.cors import CORSMiddleware

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

# Almacenamiento de imágenes SOLO para desarrollo local (ver
# app/services/storage/local.py). En producción esto debe sustituirse
# por un proveedor real (S3/Cloudinary/Supabase Storage).
MEDIA_ROOT = Path(__file__).resolve().parent.parent / "media"
MEDIA_ROOT.mkdir(exist_ok=True)
app.mount("/media", StaticFiles(directory=str(MEDIA_ROOT)), name="media")


@app.get("/")
def root():
    return {"message": "CoFlow API"}


@app.get("/health")
def health():
    return {"status": "ok"}