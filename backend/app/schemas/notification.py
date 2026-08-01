from datetime import datetime

from pydantic import BaseModel, ConfigDict

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
