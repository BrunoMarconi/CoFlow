from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.models.saved_user_profile import SavedUserProfile
from app.database.models.user import User
from app.services.user_safety_service import UserSafetyService
from app.schemas.user_public import PublicUserProfileResponse
from app.services.user_service import UserService

user_service = UserService()
user_safety_service = UserSafetyService()


class SavedProfileService:

    def save_profile(
        self,
        db: Session,
        current_user: User,
        saved_user_id: UUID,
    ) -> bool:
        if saved_user_id == current_user.id:
            raise HTTPException(
                status_code=409,
                detail="You cannot save your own profile",
            )

        target_user = (
            db.query(User).filter(User.id == saved_user_id).first()
        )

        if target_user is None:
            raise HTTPException(
                status_code=404,
                detail="User not found",
            )

        user_safety_service.ensure_not_blocked_between(
            db,
            current_user.id,
            saved_user_id,
        )

        existing = (
            db.query(SavedUserProfile)
            .filter(
                SavedUserProfile.user_id == current_user.id,
                SavedUserProfile.saved_user_id == saved_user_id,
            )
            .first()
        )

        if existing is not None:
            return True

        try:
            db.add(
                SavedUserProfile(
                    user_id=current_user.id,
                    saved_user_id=saved_user_id,
                )
            )
            db.commit()

        except IntegrityError:
            db.rollback()
            return True

        except Exception:
            db.rollback()
            raise

        return True

    def unsave_profile(
        self,
        db: Session,
        current_user: User,
        saved_user_id: UUID,
    ) -> bool:
        existing = (
            db.query(SavedUserProfile)
            .filter(
                SavedUserProfile.user_id == current_user.id,
                SavedUserProfile.saved_user_id == saved_user_id,
            )
            .first()
        )

        if existing is not None:
            db.delete(existing)
            db.commit()

        return False

    def is_saved(
        self,
        db: Session,
        current_user: User,
        saved_user_id: UUID,
    ) -> bool:
        return (
            db.query(SavedUserProfile)
            .filter(
                SavedUserProfile.user_id == current_user.id,
                SavedUserProfile.saved_user_id == saved_user_id,
            )
            .first()
            is not None
        )

    def list_saved_profiles(
        self,
        db: Session,
        current_user: User,
    ) -> list[PublicUserProfileResponse]:
        saved_rows = (
            db.query(SavedUserProfile)
            .filter(SavedUserProfile.user_id == current_user.id)
            .order_by(SavedUserProfile.created_at.desc())
            .all()
        )

        profiles = []

        for row in saved_rows:
            target_user = (
                db.query(User)
                .filter(User.id == row.saved_user_id)
                .first()
            )

            if target_user is None:
                continue

            if not user_service.can_view_profile(db, target_user, current_user):
                continue

            try:
                profiles.append(
                    user_service.build_public_profile(
                        db, target_user, current_user
                    )
                )
            except HTTPException as error:
                if error.status_code != 404:
                    raise

        return profiles
