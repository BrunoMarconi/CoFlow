from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.storage_media import StorageBackedAvatarResponse


class CommunityMessageSenderResponse(StorageBackedAvatarResponse):
    id: UUID
    first_name: str
    last_name: str


class CommunityMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)

    @field_validator("content")
    @classmethod
    def strip_content(cls, value: str) -> str:
        stripped = value.strip()

        if not stripped:
            raise ValueError("Content cannot be empty")

        return stripped


class CommunityMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    community_id: int
    content: str
    created_at: datetime
    updated_at: datetime
    sender: CommunityMessageSenderResponse
