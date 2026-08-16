from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from fastapi import HTTPException

from app.database.models.community import Community
from app.database.models.saved_community import SavedCommunity
from app.database.models.user import User


class SavedCommunityService:

    def save_community(
        self,
        db: Session,
        current_user: User,
        community_id: int,
    ) -> bool:
        community = (
            db.query(Community).filter(Community.id == community_id).first()
        )

        if community is None:
            raise HTTPException(status_code=404, detail="Community not found")

        existing = (
            db.query(SavedCommunity)
            .filter(
                SavedCommunity.user_id == current_user.id,
                SavedCommunity.community_id == community_id,
            )
            .first()
        )

        if existing is not None:
            return True

        try:
            db.add(
                SavedCommunity(
                    user_id=current_user.id,
                    community_id=community_id,
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

    def unsave_community(
        self,
        db: Session,
        current_user: User,
        community_id: int,
    ) -> bool:
        existing = (
            db.query(SavedCommunity)
            .filter(
                SavedCommunity.user_id == current_user.id,
                SavedCommunity.community_id == community_id,
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
        community_id: int,
    ) -> bool:
        return (
            db.query(SavedCommunity)
            .filter(
                SavedCommunity.user_id == current_user.id,
                SavedCommunity.community_id == community_id,
            )
            .first()
            is not None
        )
