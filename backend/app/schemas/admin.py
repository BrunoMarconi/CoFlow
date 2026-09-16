"""Schemas for CoFlow's internal community operations panel."""

from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.database.models.admin_match_review import AdminMatchReviewStatus
from app.database.models.community import CommunityFormationStatus
from app.database.models.user import UserAdminStatus


class AdminUserStatusUpdate(BaseModel):
    status: UserAdminStatus


class AdminCommunityStatusUpdate(BaseModel):
    status: CommunityFormationStatus


class AdminMatchAction(BaseModel):
    action: Literal["SAVE", "DISMISS", "PROPOSE"]


class AdminHardFilter(BaseModel):
    key: str
    label: str
    passed: bool | None
    detail: str


class AdminScoreFactor(BaseModel):
    key: str
    label: str
    score: int
    weight: int
    detail: str


class AdminUserSummary(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    email: str
    avatar_url: str | None = None
    age: int | None = None
    occupation: str | None = None
    rental_budget: int | None = None
    admin_status: UserAdminStatus
    onboarding_completed: bool
    profile_completion: int
    suggested_matches: int
    community_name: str | None = None
    created_at: datetime


class AdminUserListResponse(BaseModel):
    items: list[AdminUserSummary]
    total: int
    status_counts: dict[str, int]


class AdminMatchSuggestion(BaseModel):
    user: AdminUserSummary
    score: int
    eligible: bool
    hard_filters: list[AdminHardFilter]
    factors: list[AdminScoreFactor]
    shared_interests: list[str]
    review_status: AdminMatchReviewStatus | None = None


class AdminUserDetail(BaseModel):
    user: AdminUserSummary
    phone: str | None = None
    bio: str | None = None
    interests: list[str] = Field(default_factory=list)
    habits: dict[str, str] = Field(default_factory=dict)
    hard_filter_data: dict[str, str | int | date | None] = Field(default_factory=dict)
    matches: list[AdminMatchSuggestion] = Field(default_factory=list)


class AdminCommunityMember(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    avatar_url: str | None = None
    role: str


class AdminCommunityCandidate(BaseModel):
    user: AdminUserSummary
    score: int
    eligible: bool
    reasons: list[str]


class AdminCommunitySummary(BaseModel):
    id: int
    name: str
    city: str
    neighborhood: str | None = None
    max_members: int
    open_spots: int
    move_in_date: date | None = None
    monthly_rent: int | None = None
    formation_status: CommunityFormationStatus
    members: list[AdminCommunityMember]
    candidates: list[AdminCommunityCandidate]
    created_at: datetime


class AdminMatchActionResponse(BaseModel):
    status: AdminMatchReviewStatus
