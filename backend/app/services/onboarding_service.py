from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.database.models.compatibility_profile import CompatibilityProfile
from app.database.models.user import User
from app.schemas.onboarding import OnboardingCreate

ANSWER_FIELDS = [
    "cleanliness",
    "dishes",
    "common_objects",
    "noise",
    "visits",
    "sleepovers",
    "wake_up",
    "night_noise",
    "smoking",
    "alcohol",
    "pets",
    "bills",
    "food",
    "communication",
    "conflicts",
    "rules",
    "culture",
    "space",
    "lifestyle",
]


class OnboardingService:

    def save_or_update_profile(
        self,
        db: Session,
        user: User,
        data: OnboardingCreate
    ):

        profile = (
            db.query(CompatibilityProfile)
            .filter(CompatibilityProfile.user_id == user.id)
            .first()
        )

        if profile is None:
            profile = CompatibilityProfile(
                user_id=user.id,
                **{field: getattr(data, field) for field in ANSWER_FIELDS}
            )
            db.add(profile)
        else:
            for field in ANSWER_FIELDS:
                setattr(profile, field, getattr(data, field))

        user.onboarding_completed = True

        db.commit()
        db.refresh(profile)

        return profile

    def get_profile(self, db: Session, user: User):

        profile = (
            db.query(CompatibilityProfile)
            .filter(CompatibilityProfile.user_id == user.id)
            .first()
        )

        if profile is None:
            raise HTTPException(
                status_code=404,
                detail="Onboarding profile not found"
            )

        return profile
