from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.database.models.user import ProfileVisibility
from app.schemas.storage_media import StorageBackedAvatarResponse
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
    interests: list[str] | None = Field(default=None, max_length=12)

    @field_validator("interests")
    @classmethod
    def normalize_interests(cls, values: list[str] | None) -> list[str] | None:
        if values is None:
            return None
        result: list[str] = []
        seen: set[str] = set()
        for raw_value in values:
            value = " ".join(raw_value.strip().split())
            key = value.casefold()
            if not value or key in seen:
                continue
            if len(value) > 40:
                raise ValueError("Each interest must have at most 40 characters")
            seen.add(key)
            result.append(value)
        return result


class ProfilePrivacyUpdateRequest(BaseModel):
    profile_visibility: ProfileVisibility


class ProfilePrivacyResponse(BaseModel):
    profile_visibility: ProfileVisibility


class UserResponse(StorageBackedAvatarResponse):
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
    photos: list[UserPhotoResponse] = Field(default_factory=list)
    age: int | None = None
    occupation: str | None = None
    bio: str | None = None
    interests: list[str] = Field(default_factory=list)
    profile_visibility: ProfileVisibility = ProfileVisibility.PUBLIC
    # No es un campo del modelo: se rellena en la ruta a partir de la
    # feature flag EMAIL_VERIFICATION_ENABLED.
    email_verification_enabled: bool = True
