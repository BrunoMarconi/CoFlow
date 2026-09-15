from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.database.models.owner_profile import OwnerType
from app.database.models.property import PropertyStatus, PropertyType
from app.schemas.property import PropertyResponse


class TeamOwnerResponse(BaseModel):
    owner_profile_id: int
    user_id: UUID
    owner_type: OwnerType
    display_name: str
    company_name: str | None = None
    first_name: str
    last_name: str
    # None cuando el alta se hizo sin email real (dirección provisional
    # @coflow.pending): no es un contacto utilizable.
    email: str | None = None
    phone: str | None = None
    # True si ya puede entrar: activó su enlace (contraseña) o usa Google.
    account_activated: bool
    # Solo en el buscador de clientes; en listados de viviendas no aplica.
    property_count: int | None = None


class TeamPropertySummaryResponse(BaseModel):
    id: int
    title: str
    status: PropertyStatus
    property_type: PropertyType
    address_line: str
    city: str
    neighborhood: str | None = None
    postal_code: str
    total_monthly_rent: int | None = None
    deposit: int | None = None
    bedrooms: int
    bathrooms: int
    max_tenants: int
    surface_m2: int | None = None
    available_from: date | None = None
    cover_image_url: str | None = None
    image_count: int
    missing_fields: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    ready_at: datetime | None = None
    owner: TeamOwnerResponse


class TeamPropertyDetailResponse(PropertyResponse):
    owner: TeamOwnerResponse
    missing_fields: list[str] = Field(default_factory=list)


class TeamPropertyUpdate(BaseModel):
    # Mismas reglas relajadas que AssistedPropertyCreate: el equipo guarda
    # borradores a medias. Los mínimos reales se exigen al publicar
    # (PropertyService._missing_ready_fields). Un None en una columna
    # obligatoria significa "no tocar"; en una opcional, "vaciar".
    title: str | None = Field(default=None, max_length=150)
    description: str | None = None
    property_type: PropertyType | None = None

    address_line: str | None = Field(default=None, max_length=200)
    city: str | None = Field(default=None, max_length=100)
    province: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=15)
    neighborhood: str | None = Field(default=None, max_length=120)

    latitude: float | None = None
    longitude: float | None = None

    surface_m2: int | None = Field(default=None, gt=0)
    bedrooms: int | None = Field(default=None, ge=0)
    bathrooms: int | None = Field(default=None, ge=1)
    floor: str | None = Field(default=None, max_length=20)
    has_elevator: bool | None = None
    furnished: bool | None = None
    max_tenants: int | None = Field(default=None, ge=1)

    total_monthly_rent: int | None = Field(default=None, ge=0)
    deposit: int | None = Field(default=None, ge=0)
    utilities_included: bool | None = None

    available_from: date | None = None
    minimum_stay_months: int | None = Field(default=None, ge=1)

    pets_allowed: bool | None = None
    smoking_allowed: bool | None = None
    couples_allowed: bool | None = None
    students_allowed: bool | None = None
    registration_allowed: bool | None = None
    additional_requirements: str | None = Field(default=None, max_length=2000)

    amenity_ids: list[int] | None = None
