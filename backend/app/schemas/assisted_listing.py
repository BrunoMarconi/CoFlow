from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.property import PropertyCreate


class AssistedOwnerCreate(BaseModel):
    first_name: str = Field(min_length=2, max_length=100)
    last_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=6, max_length=30)


class AssistedListingCreate(BaseModel):
    owner: AssistedOwnerCreate
    property: PropertyCreate
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
    expires_at: datetime


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
