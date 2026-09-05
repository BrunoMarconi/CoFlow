from datetime import datetime

from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

from app.database.models.notification import NotificationType


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: NotificationType
    title: str
    message: str
    link: str | None = None
    is_read: bool
    created_at: datetime


class UnreadNotificationCountResponse(BaseModel):
    unread_count: int


class NotificationSnapshotResponse(BaseModel):
    items: list[NotificationResponse]
    unread_count: int
    unread_message_count: int


class NotificationLinkReadRequest(BaseModel):
    link: str = Field(min_length=1, max_length=255)


class NotificationLinkReadResponse(BaseModel):
    marked_count: int
    unread_count: int
    unread_message_count: int


class NotificationPreferences(BaseModel):
    in_app_enabled: bool = True
    email_enabled: bool = True
    messages: bool = True
    connections: bool = True
    communities: bool = True
    applications: bool = True
    email_frequency: Literal["immediate", "daily", "never"] = "immediate"
    quiet_hours_enabled: bool = False
    quiet_hours_start: str = Field(default="22:00", pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    quiet_hours_end: str = Field(default="08:00", pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
