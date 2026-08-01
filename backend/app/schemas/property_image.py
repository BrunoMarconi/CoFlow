from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PropertyImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    property_id: int
    image_url: str
    position: int
    is_cover: bool
    created_at: datetime


class PropertyImageOrderUpdate(BaseModel):
    image_ids: list[int] = Field(default_factory=list, min_length=1)
