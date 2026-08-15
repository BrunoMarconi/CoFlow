from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

LegalReportContentType = Literal["PROFILE", "PROPERTY", "COMMUNITY", "OTHER"]


class LegalReportCreate(BaseModel):
    content_type: LegalReportContentType
    url_or_location: str = Field(min_length=1, max_length=2000)
    reason: str = Field(min_length=1)
    additional_info: str | None = None
    reporter_name: str | None = Field(default=None, max_length=200)
    reporter_email: EmailStr | None = None
    good_faith_declared: bool


class LegalReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    content_type: str
    created_at: datetime
