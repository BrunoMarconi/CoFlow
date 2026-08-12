from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.storage_media import StorageBackedAvatarResponse
from app.schemas.user_photo import UserPhotoResponse


class PublicUserCommunityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    city: str


class PublicUserPreferencesResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    cleanliness: str
    dishes: str
    common_objects: str
    noise: str
    visits: str
    sleepovers: str
    wake_up: str
    night_noise: str
    smoking: str
    alcohol: str
    pets: str
    bills: str
    food: str
    communication: str
    conflicts: str
    rules: str
    culture: str
    space: str
    lifestyle: str


class PublicUserProfileResponse(StorageBackedAvatarResponse):
    """
    Perfil público de una persona. Solo incluye datos que
    cualquier persona autenticada puede ver: nunca email,
    teléfono, ni información económica interna de comunidades
    ajenas.

    is_saved y connection_status son relativos a quien consulta
    el perfil (igual que is_member/current_user_role en
    CommunityResponse).
    """

    id: UUID
    first_name: str
    last_name: str
    rental_budget: int | None = None
    preferences: PublicUserPreferencesResponse | None = None
    community: PublicUserCommunityResponse | None = None
    is_saved: bool = False
    connection_status: str = "NONE"
    connection_id: int | None = None
    is_owner: bool = False
    is_looking_for_roommates: bool = True
    photos: list[UserPhotoResponse] = Field(default_factory=list)
    age: int | None = None
    occupation: str | None = None
    bio: str | None = None
    # Calculados en UserService.build_public_profile: is_verified a
    # partir de is_email_verified, is_online a partir de
    # last_active_at. No son columnas del modelo.
    is_verified: bool = False
    is_online: bool = False
