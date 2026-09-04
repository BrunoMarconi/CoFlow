import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


ProductEventName = Literal[
    "page_view",
    "signup_completed",
    "login_completed",
    "onboarding_completed",
    "profile_viewed",
    "connection_requested",
    "message_sent",
    "application_submitted",
    "community_created",
]


class ProductEventCreate(BaseModel):
    event_id: uuid.UUID
    session_id: uuid.UUID
    name: ProductEventName
    path: str | None = Field(default=None, max_length=255, pattern=r"^/")
    source: Literal["web"] = "web"


class ProductEventAccepted(BaseModel):
    accepted: bool = True


class FunnelMetric(BaseModel):
    name: str
    events: int
    actors: int


class FunnelResponse(BaseModel):
    since: datetime
    metrics: list[FunnelMetric]
