from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.database.models.property import (
    PropertyStatus,
    PropertySubscriptionStatus,
    PropertyType,
)
from app.schemas.amenity import AmenityResponse
from app.schemas.property_image import PropertyImageResponse


class PropertyCreate(BaseModel):
    title: str = Field(min_length=5, max_length=150)
    description: str = Field(min_length=30)
    property_type: PropertyType

    address_line: str = Field(min_length=1, max_length=200)
    city: str = Field(min_length=1, max_length=100)
    province: str = Field(min_length=1, max_length=100)
    postal_code: str = Field(min_length=1, max_length=15)
    neighborhood: str | None = Field(default=None, max_length=120)

    latitude: float | None = None
    longitude: float | None = None

    surface_m2: int | None = Field(default=None, gt=0)
    bedrooms: int = Field(ge=0)
    bathrooms: int = Field(ge=1)
    floor: str | None = Field(default=None, max_length=20)
    has_elevator: bool = False
    furnished: bool = False
    max_tenants: int = Field(ge=1)

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


class PropertyUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=5, max_length=150)
    description: str | None = Field(default=None, min_length=30)
    property_type: PropertyType | None = None

    address_line: str | None = Field(default=None, min_length=1, max_length=200)
    city: str | None = Field(default=None, min_length=1, max_length=100)
    province: str | None = Field(default=None, min_length=1, max_length=100)
    postal_code: str | None = Field(default=None, min_length=1, max_length=15)
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

    @field_validator("title", "description")
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        return value.strip() if value is not None else value


class PropertyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_profile_id: int
    title: str
    description: str
    property_type: PropertyType
    status: PropertyStatus

    address_line: str
    city: str
    province: str
    postal_code: str
    neighborhood: str | None = None
    latitude: float | None = None
    longitude: float | None = None

    surface_m2: int | None = None
    bedrooms: int
    bathrooms: int
    floor: str | None = None
    has_elevator: bool
    furnished: bool
    max_tenants: int

    total_monthly_rent: int | None = None
    deposit: int | None = None
    utilities_included: bool

    available_from: date | None = None
    minimum_stay_months: int | None = None

    pets_allowed: bool | None = None
    smoking_allowed: bool | None = None
    couples_allowed: bool | None = None
    students_allowed: bool | None = None
    registration_allowed: bool | None = None
    additional_requirements: str | None = None

    ready_at: datetime | None = None
    rented_at: datetime | None = None
    archived_at: datetime | None = None

    subscription_status: PropertySubscriptionStatus
    trial_ends_at: datetime | None = None

    created_at: datetime
    updated_at: datetime

    images: list[PropertyImageResponse] = Field(default_factory=list)
    amenities: list[AmenityResponse] = Field(default_factory=list)


class PropertySummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    status: PropertyStatus
    property_type: PropertyType
    city: str
    neighborhood: str | None = None
    total_monthly_rent: int | None = None
    bedrooms: int
    max_tenants: int
    cover_image_url: str | None = None
    updated_at: datetime


class PropertyReadyCheckResponse(BaseModel):
    ready: bool
    missing_fields: list[str] = Field(default_factory=list)
