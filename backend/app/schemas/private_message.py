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
    reply_to_id: int | None = None

    @field_validator("content")
    @classmethod
    def strip_content(cls, value: str) -> str:
        stripped = value.strip()

        if not stripped:
            raise ValueError("Content cannot be empty")

        return stripped


class PrivateMessageReplyPreview(BaseModel):
    id: int
    content: str
    sender_id: UUID
    sender_first_name: str


class PrivateMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    connection_id: int
    content: str
    created_at: datetime
    updated_at: datetime
    sender: PrivateMessageSenderResponse
    reply_to: PrivateMessageReplyPreview | None = None
    like_count: int = 0
    liked_by_me: bool = False


class PrivateConversationSummaryResponse(BaseModel):
    """Una conversación aceptada junto a su último mensaje."""

    connection: UserConnectionResponse
    last_message: PrivateMessageResponse | None = None
