from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.database.models.community_invitation import CommunityInvitationStatus


class CommunityInvitationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    community_id: int
    invited_by_id: UUID
    token: str
    status: CommunityInvitationStatus
    expires_at: datetime
    accepted_by_id: UUID | None = None
    created_at: datetime
    accepted_at: datetime | None = None
    cancelled_at: datetime | None = None


class CommunityInvitationCommunityResponse(BaseModel):
    """Datos públicos y seguros de la comunidad para la pantalla de invitación."""

    id: int
    name: str
    city: str
    member_count: int
    owner_first_name: str
    owner_last_name: str


class CommunityInvitationDetailResponse(BaseModel):
    """Respuesta al consultar una invitación por token."""

    status: CommunityInvitationStatus
    expires_at: datetime
    community: CommunityInvitationCommunityResponse
