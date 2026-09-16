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


def _missing_profile_requirements(user: User) -> list[str]:
    """Datos de perfil sin los que no se da por terminado el onboarding.

    El frontend ya no deja avanzar sin ellos, pero completar el onboarding
    es lo que abre comunidades y el perfil público: la comprobación vive
    también aquí para que nadie llegue ahí con la ficha a medias llamando
    directamente al endpoint.
    """
    missing: list[str] = []

    if user.age is None:
        missing.append("tu edad")
    if not (user.occupation or "").strip():
        missing.append("tu ocupación")
    if not (user.avatar_storage_key or user.avatar_url):
        missing.append("una foto o un avatar de CoFlow")

    return missing


def _join_in_spanish(items: list[str]) -> str:
    if len(items) == 1:
        return items[0]
    return f"{', '.join(items[:-1])} y {items[-1]}"


class OnboardingService:

    def save_or_update_profile(
        self,
        db: Session,
        user: User,
        data: OnboardingCreate
    ):

        missing = _missing_profile_requirements(user)
        if missing:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Para terminar tu perfil necesitamos "
                    f"{_join_in_spanish(missing)}."
                ),
            )

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
