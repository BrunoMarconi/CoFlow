from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)

from app.database.models.community_application import CommunityApplicationStatus


class CommunityApplicationCreate(BaseModel):
    message: str = Field(min_length=20, max_length=2000)

    @field_validator("message")
    @classmethod
    def strip_message(cls, value: str) -> str:
        stripped = value.strip()

        if len(stripped) < 20:
            raise ValueError(
                "Message must be at least 20 characters long"
            )

        return stripped


class CommunityApplicationApplicantPreferencesResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    cleanliness: str
    lifestyle: str
    smoking: str
    pets: str


class CommunityApplicationApplicantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    first_name: str
    last_name: str
    rental_budget: int | None = None
    preferences: CommunityApplicationApplicantPreferencesResponse | None = (
        None
    )

    @model_validator(mode="before")
    @classmethod
    def inject_preferences(cls, applicant):
        """
        `User.compatibility_profile` no se llama `preferences`, así que
        el mapeo automático de `from_attributes` no lo encuentra solo.
        Lo exponemos aquí bajo el nombre que espera el frontend.
        """
        if isinstance(applicant, dict):
            return applicant

        return {
            "id": applicant.id,
            "first_name": applicant.first_name,
            "last_name": applicant.last_name,
            "rental_budget": applicant.rental_budget,
            "preferences": getattr(
                applicant, "compatibility_profile", None
            ),
        }


class CommunityApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    community_id: int
    status: CommunityApplicationStatus
    message: str
    created_at: datetime
    reviewed_at: datetime | None = None
    cancelled_at: datetime | None = None
    applicant: CommunityApplicationApplicantResponse
