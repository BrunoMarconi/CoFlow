from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class OnboardingCreate(BaseModel):
    cleanliness: str
    dishes: str
    common_objects: str
    noise: str
    visits: str
    sleepovers: str
    wake_up: str
    night_noise: str
    smoking: str
    alcohol: str
    pets: str
    bills: str
    food: str
    communication: str
    conflicts: str
    rules: str
    culture: str
    space: str
    lifestyle: str


class OnboardingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID

    cleanliness: str
    dishes: str
    common_objects: str
    noise: str
    visits: str
    sleepovers: str
    wake_up: str
    night_noise: str
    smoking: str
    alcohol: str
    pets: str
    bills: str
    food: str
    communication: str
    conflicts: str
    rules: str
    culture: str
    space: str
    lifestyle: str

    created_at: datetime
    updated_at: datetime
