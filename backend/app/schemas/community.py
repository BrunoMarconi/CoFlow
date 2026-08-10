from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from app.database.models.community import (
    CommunityJoinType,
    CommunityProfileType,
    CommunityUrgency,
)
from app.database.models.community_member import CommunityMemberRole

# Paleta cerrada y elegante para la portada automática (fondo de color
# + avatares de los miembros encima, ver frontend CommunityCover.tsx).
# Deliberadamente pequeña: nada de un selector de color libre, para
# mantener el aspecto premium/curado en todas las comunidades.
CommunityCoverColor = Literal[
    "sage", "cream", "stone", "sand", "smoke", "forest"
]


class CommunityPreferencesCreate(BaseModel):
    cleanliness: str = Field(min_length=1, max_length=150)
    atmosphere: str = Field(min_length=1, max_length=150)
    visits: str = Field(min_length=1, max_length=150)
    sleepovers: str = Field(min_length=1, max_length=150)
    smoking: str = Field(min_length=1, max_length=150)
    pets: str = Field(min_length=1, max_length=150)
    rules: str = Field(min_length=1, max_length=150)
    lifestyle: str = Field(min_length=1, max_length=150)


class CommunityPreferencesUpdate(BaseModel):
    cleanliness: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )
    atmosphere: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )
    visits: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )
    sleepovers: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )
    smoking: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )
    pets: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )
    rules: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )
    lifestyle: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )


class CommunityPreferencesResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    community_id: int

    cleanliness: str
    atmosphere: str
    visits: str
    sleepovers: str
    smoking: str
    pets: str
    rules: str
    lifestyle: str

    created_at: datetime
    updated_at: datetime

class CommunityMemberUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    first_name: str
    last_name: str
    avatar_url: str | None = None


class CommunityMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: UUID
    role: CommunityMemberRole
    joined_at: datetime
    user: CommunityMemberUserResponse


class CommunityCreate(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    description: str = Field(min_length=20)
    city: str = Field(min_length=1, max_length=100)
    province: str | None = Field(default=None, max_length=100)
    neighborhood: str | None = Field(default=None, max_length=120)
    max_members: int = Field(ge=2, le=12)

    preferences: CommunityPreferencesCreate
    join_type: CommunityJoinType = CommunityJoinType.REQUEST

    open_spots: int = Field(default=1, ge=0, le=12)

    urgency: CommunityUrgency = CommunityUrgency.NORMAL

    profile_type: CommunityProfileType
    profile_description: str | None = Field(
        default=None,
        max_length=500,
    )

    monthly_rent: int | None = Field(
        default=None,
        ge=0,
        le=10000,
    )

    deposit: int | None = Field(
        default=None,
        ge=0,
        le=30000,
    )

    move_in_date: date | None = None

    room_description: str | None = Field(
        default=None,
        max_length=2000,
    )

    cover_color: CommunityCoverColor = "sage"


class CommunityUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=3,
        max_length=120,
    )
    description: str | None = Field(
        default=None,
        min_length=20,
    )
    city: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    province: str | None = Field(
        default=None,
        max_length=100,
    )
    neighborhood: str | None = Field(
        default=None,
        max_length=120,
    )
    max_members: int | None = Field(
        default=None,
        ge=2,
        le=12,
    )

    preferences: CommunityPreferencesUpdate | None = None
    join_type: CommunityJoinType | None = None

    open_spots: int | None = Field(
        default=None,
        ge=0,
        le=12,
    )

    urgency: CommunityUrgency | None = None

    profile_type: CommunityProfileType | None = None
    profile_description: str | None = Field(
        default=None,
        max_length=500,
    )

    monthly_rent: int | None = Field(
        default=None,
        ge=0,
        le=10000,
    )

    deposit: int | None = Field(
        default=None,
        ge=0,
        le=30000,
    )

    move_in_date: date | None = None

    room_description: str | None = Field(
        default=None,
        max_length=2000,
    )

    cover_color: CommunityCoverColor | None = None


class CommunityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    city: str
    province: str | None = None
    neighborhood: str | None = None
    max_members: int

    join_type: CommunityJoinType

    open_spots: int
    urgency: CommunityUrgency
    profile_type: CommunityProfileType
    profile_description: str | None = None
    monthly_rent: int | None = None
    total_monthly_rent: int | None = None
    deposit: int | None = None
    move_in_date: date | None = None
    room_description: str | None = None

    cover_color: str
    cover_image_url: str | None = None

    owner_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    preferences: CommunityPreferencesResponse | None = None

    member_count: int = 0
    is_member: bool = False
    current_user_role: CommunityMemberRole | None = None
    is_full: bool = False

    members: list[CommunityMemberResponse] = Field(
        default_factory=list
    )