from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user_photo import UserPhotoResponse


class UpdateProfileRequest(BaseModel):
    first_name: str
    last_name: str
    phone: str | None = None
    rental_budget: int | None = Field(
        default=None,
        ge=0,
        le=20000,
    )
    is_looking_for_roommates: bool = True
    age: int | None = Field(default=None, ge=18, le=99)
    occupation: str | None = Field(default=None, max_length=100)
    bio: str | None = Field(default=None, max_length=160)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    first_name: str
    last_name: str
    email: str
    phone: str | None = None
    role: str
    onboarding_completed: bool
    rental_budget: int | None = None
    is_looking_for_roommates: bool
    is_email_verified: bool
    avatar_url: str | None = None
    photos: list[UserPhotoResponse] = Field(default_factory=list)
    age: int | None = None
    occupation: str | None = None
    bio: str | None = None
    # No es un campo del modelo: se rellena en la ruta a partir de la
    # feature flag EMAIL_VERIFICATION_ENABLED.
    email_verification_enabled: bool = True