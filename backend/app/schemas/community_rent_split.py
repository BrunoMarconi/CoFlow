from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.database.models.community_member import CommunityMemberRole


class CommunityRentContributionUpdate(BaseModel):
    member_id: int
    monthly_contribution: int | None = Field(
        default=None,
        ge=0,
        le=100000,
    )


class CommunityRentSplitUpdate(BaseModel):
    total_monthly_rent: int | None = Field(
        default=None,
        ge=0,
        le=100000,
    )
    contributions: list[CommunityRentContributionUpdate] = Field(
        default_factory=list,
    )


class CommunityMemberContributionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    member_id: int
    user_id: UUID
    first_name: str
    last_name: str
    role: CommunityMemberRole
    monthly_contribution: int | None = None
    contribution_percentage: float | None = None


class CommunityRentSplitResponse(BaseModel):
    total_monthly_rent: int | None = None
    total_configured: int
    remaining_amount: int | None = None
    contributions: list[CommunityMemberContributionResponse] = Field(
        default_factory=list,
    )
