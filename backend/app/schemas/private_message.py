from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.storage_media import StorageBackedAvatarResponse
from app.schemas.user_connection import UserConnectionResponse


class PrivateMessageSenderResponse(StorageBackedAvatarResponse):
    id: UUID
    first_name: str
    last_name: str


class PrivateMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)

    @field_validator("content")
    @classmethod
    def strip_content(cls, value: str) -> str:
        stripped = value.strip()

        if not stripped:
            raise ValueError("Content cannot be empty")

        return stripped


class PrivateMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    connection_id: int
    content: str
    created_at: datetime
    updated_at: datetime
    sender: PrivateMessageSenderResponse


class PrivateConversationSummaryResponse(BaseModel):
    """Una conversación aceptada junto a su último mensaje."""

    connection: UserConnectionResponse
    last_message: PrivateMessageResponse | None = None
