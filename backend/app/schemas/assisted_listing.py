from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.database.models.property import PropertyType


class AssistedOwnerCreate(BaseModel):
    # Nada es obligatorio aquí: en el alta asistida el admin solo tiene
    # lo que le ha dado tiempo a anotar durante la llamada. Los campos
    # que la base de datos exige de verdad (email único, nombre) se
    # rellenan con valores por defecto en create_assisted_listing.
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)


class AssistedPropertyCreate(BaseModel):
    # Igual que PropertyCreate pero con todo opcional: el admin puede
    # crear el borrador con datos incompletos y completarlo antes de
    # publicar (mark_ready_admin exige los campos reales en ese punto).
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
    has_elevator: bool = False
    furnished: bool = False
    max_tenants: int | None = Field(default=None, ge=1)

    total_monthly_rent: int | None = Field(default=None, ge=0)
    deposit: int | None = Field(default=None, ge=0)
    utilities_included: bool = False

    available_from: date | None = None
    minimum_stay_months: int | None = Field(default=None, ge=1)

    pets_allowed: bool | None = None
    smoking_allowed: bool | None = None
    couples_allowed: bool | None = None
    students_allowed: bool | None = None
    registration_allowed: bool | None = None
    additional_requirements: str | None = Field(default=None, max_length=2000)

    amenity_ids: list[int] = Field(default_factory=list)


class AssistedListingCreate(BaseModel):
    owner: AssistedOwnerCreate
    property: AssistedPropertyCreate
    owner_consent: bool

    @field_validator("owner_consent")
    @classmethod
    def require_consent(cls, value: bool) -> bool:
        if not value:
            raise ValueError("El propietario debe autorizar el alta asistida.")
        return value


class AssistedListingResponse(BaseModel):
    property_id: int
    owner_email: str
    claim_url: str


class OwnerClaimPreview(BaseModel):
    first_name: str
    property_title: str
    property_city: str
    expires_at: datetime


class OwnerClaimRequest(BaseModel):
    password: str = Field(min_length=8, max_length=128)
    birth_date: date
    terms_accepted: bool

    @field_validator("terms_accepted")
    @classmethod
    def require_terms(cls, value: bool) -> bool:
        if not value:
            raise ValueError("Debes aceptar los términos para activar la cuenta.")
        return value
