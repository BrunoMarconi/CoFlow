from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database.models.community import Community
from app.database.models.community_member import CommunityMember
from app.database.models.compatibility_profile import CompatibilityProfile
from app.database.models.saved_user_profile import SavedUserProfile
from app.database.models.user import User
from app.database.models.user_connection import (
    UserConnection,
    UserConnectionStatus,
)
from app.schemas.user_photo import UserPhotoResponse
from app.schemas.user_public import (
    PublicUserCommunityResponse,
    PublicUserPreferencesResponse,
    PublicUserProfileResponse,
)

MAX_LIMIT = 100


class UserService:

    def build_public_profile(
        self,
        db: Session,
        user: User,
        viewer: User | None = None,
    ) -> PublicUserProfileResponse:
        preferences = (
            db.query(CompatibilityProfile)
            .filter(CompatibilityProfile.user_id == user.id)
            .first()
        )

        active_membership = (
            db.query(CommunityMember)
            .join(
                Community,
                Community.id == CommunityMember.community_id,
            )
            .filter(
                CommunityMember.user_id == user.id,
                Community.is_active.is_(True),
            )
            .first()
        )

        community = None

        if active_membership is not None:
            community = (
                db.query(Community)
                .filter(
                    Community.id == active_membership.community_id,
                )
                .first()
            )

        is_saved = False
        connection_status = "NONE"
        connection_id = None

        if viewer is not None and viewer.id != user.id:
            is_saved = (
                db.query(SavedUserProfile)
                .filter(
                    SavedUserProfile.user_id == viewer.id,
                    SavedUserProfile.saved_user_id == user.id,
                )
                .first()
                is not None
            )

            connection = (
                db.query(UserConnection)
                .filter(
                    or_(
                        (UserConnection.requester_id == viewer.id)
                        & (UserConnection.recipient_id == user.id),
                        (UserConnection.requester_id == user.id)
                        & (UserConnection.recipient_id == viewer.id),
                    ),
                    UserConnection.status.in_(
                        [
                            UserConnectionStatus.PENDING,
                            UserConnectionStatus.ACCEPTED,
                        ]
                    ),
                )
                .first()
            )

            if connection is not None:
                connection_id = connection.id

                if connection.status == UserConnectionStatus.ACCEPTED:
                    connection_status = "ACCEPTED"
                elif connection.requester_id == viewer.id:
                    connection_status = "PENDING_SENT"
                else:
                    connection_status = "PENDING_RECEIVED"

        return PublicUserProfileResponse(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            rental_budget=user.rental_budget,
            preferences=(
                PublicUserPreferencesResponse.model_validate(preferences)
                if preferences is not None
                else None
            ),
            community=(
                PublicUserCommunityResponse.model_validate(community)
                if community is not None
                else None
            ),
            is_saved=is_saved,
            connection_status=connection_status,
            connection_id=connection_id,
            is_owner=user.owner_profile is not None,
            is_looking_for_roommates=user.is_looking_for_roommates,
            avatar_url=user.avatar_url,
            photos=[
                UserPhotoResponse.model_validate(photo)
                for photo in user.photos
            ],
        )

    def get_public_profile(
        self,
        db: Session,
        user_id: UUID,
        viewer: User | None = None,
    ) -> PublicUserProfileResponse:
        user = db.query(User).filter(User.id == user_id).first()

        if user is None:
            raise HTTPException(
                status_code=404,
                detail="User not found",
            )

        return self.build_public_profile(db, user, viewer)

    def list_public_profiles(
        self,
        db: Session,
        viewer: User,
        max_budget: int | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> list[PublicUserProfileResponse]:
        limit = min(max(limit, 1), MAX_LIMIT)
        skip = max(skip, 0)

        query = db.query(User).filter(
            User.id != viewer.id,
            User.is_looking_for_roommates.is_(True),
        )

        if max_budget is not None:
            query = query.filter(
                User.rental_budget.is_not(None),
                User.rental_budget <= max_budget,
            )

        users = (
            query
            .order_by(User.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        return [
            self.build_public_profile(db, user, viewer)
            for user in users
        ]
