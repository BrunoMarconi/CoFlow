from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.storage_media import StorageBackedImageResponse


class UserPhotoResponse(StorageBackedImageResponse):
    id: int
    user_id: UUID
    position: int
    created_at: datetime


class UserPhotoOrderUpdate(BaseModel):
    photo_ids: list[int] = Field(default_factory=list, min_length=1)
