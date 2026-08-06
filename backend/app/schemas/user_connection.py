from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.database.models.user_connection import UserConnectionStatus


class UserConnectionParticipantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    first_name: str
    last_name: str
    avatar_url: str | None = None


class UserConnectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: UserConnectionStatus
    created_at: datetime
    responded_at: datetime | None = None
    requester: UserConnectionParticipantResponse
    recipient: UserConnectionParticipantResponse


class UserConnectionRequestsResponse(BaseModel):
    received: list[UserConnectionResponse] = Field(default_factory=list)
    sent: list[UserConnectionResponse] = Field(default_factory=list)
