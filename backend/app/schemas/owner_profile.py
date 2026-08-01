from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.database.models.owner_profile import OwnerType


class OwnerProfileCreate(BaseModel):
    owner_type: OwnerType
    display_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=6, max_length=30)
    contact_email: str = Field(min_length=5, max_length=255)
    company_name: str | None = Field(default=None, max_length=150)
    tax_id: str | None = Field(default=None, max_length=50)


class OwnerProfileUpdate(BaseModel):
    owner_type: OwnerType | None = None
    display_name: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = Field(default=None, min_length=6, max_length=30)
    contact_email: str | None = Field(default=None, min_length=5, max_length=255)
    company_name: str | None = Field(default=None, max_length=150)
    tax_id: str | None = Field(default=None, max_length=50)


class OwnerProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: UUID
    owner_type: OwnerType
    display_name: str
    phone: str
    contact_email: str
    company_name: str | None = None
    tax_id: str | None = None
    created_at: datetime
    updated_at: datetime
