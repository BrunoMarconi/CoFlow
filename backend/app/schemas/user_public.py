from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

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


class PublicUserProfileResponse(BaseModel):
    """
    Perfil público de una persona. Solo incluye datos que
    cualquier persona autenticada puede ver: nunca email,
    teléfono, ni información económica interna de comunidades
    ajenas.

    is_saved y connection_status son relativos a quien consulta
    el perfil (igual que is_member/current_user_role en
    CommunityResponse).
    """

    model_config = ConfigDict(from_attributes=True)

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
    avatar_url: str | None = None
    photos: list[UserPhotoResponse] = Field(default_factory=list)
