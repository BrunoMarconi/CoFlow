from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class UserPhotoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: UUID
    image_url: str
    position: int
    created_at: datetime


class UserPhotoOrderUpdate(BaseModel):
    photo_ids: list[int] = Field(default_factory=list, min_length=1)
