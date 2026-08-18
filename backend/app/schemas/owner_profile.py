from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.database.models.owner_profile import OwnerType

_COMPANY_LIKE_TYPES = {OwnerType.COMPANY, OwnerType.AGENCY}


class OwnerProfileCreate(BaseModel):
    owner_type: OwnerType
    display_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=6, max_length=30)
    contact_email: EmailStr
    company_name: str | None = Field(default=None, max_length=150)
    tax_id: str | None = Field(default=None, max_length=50)

    @model_validator(mode="after")
    def require_company_name_for_business_types(self) -> "OwnerProfileCreate":
        if self.owner_type in _COMPANY_LIKE_TYPES and not (
            self.company_name and self.company_name.strip()
        ):
            raise ValueError(
                "La razón social es obligatoria para empresas e inmobiliarias."
            )
        return self


class OwnerProfileUpdate(BaseModel):
    # Sin el validador de razón social que sí lleva OwnerProfileCreate:
    # esto es una actualización parcial (solo llegan los campos que
    # cambian), así que no puede saber si company_name ya existe en la
    # fila actual — exigirlo aquí rechazaría, por ejemplo, un cambio de
    # teléfono que no toca owner_type ni company_name para un perfil
    # de empresa ya completo.
    owner_type: OwnerType | None = None
    display_name: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = Field(default=None, min_length=6, max_length=30)
    contact_email: EmailStr | None = None
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
