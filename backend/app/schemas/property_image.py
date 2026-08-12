from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.storage_media import StorageBackedImageResponse


class PropertyImageResponse(StorageBackedImageResponse):
    id: int
    property_id: int
    position: int
    is_cover: bool
    created_at: datetime


class PropertyImageOrderUpdate(BaseModel):
    image_ids: list[int] = Field(default_factory=list, min_length=1)
