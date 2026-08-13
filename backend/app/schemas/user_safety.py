from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.storage_media import StorageBackedAvatarResponse


ReportReason = Literal[
    "HARASSMENT",
    "SPAM",
    "IMPERSONATION",
    "UNSAFE_BEHAVIOUR",
    "INAPPROPRIATE_CONTENT",
    "OTHER",
]


class UserReportCreate(BaseModel):
    reason: ReportReason
    details: str | None = Field(default=None, max_length=500)


class UserReportResponse(BaseModel):
    id: int
    created_at: datetime
    submitted: bool = True


class UserBlockResponse(BaseModel):
    blocked: bool


class BlockedUserResponse(StorageBackedAvatarResponse):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    first_name: str
    last_name: str
    blocked_at: datetime
