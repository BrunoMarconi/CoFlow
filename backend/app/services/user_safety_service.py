from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.models.saved_user_profile import SavedUserProfile
from app.database.models.user import User
from app.database.models.user_block import UserBlock
from app.database.models.user_connection import (
    UserConnection,
    UserConnectionStatus,
)
from app.database.models.user_report import UserReport
from app.schemas.user_safety import UserReportCreate


class UserSafetyService:

    def ensure_not_blocked_between(
        self,
        db: Session,
        user_a_id: UUID,
        user_b_id: UUID,
    ) -> None:
        block = (
            db.query(UserBlock)
            .filter(
                or_(
                    (UserBlock.blocker_id == user_a_id)
                    & (UserBlock.blocked_user_id == user_b_id),
                    (UserBlock.blocker_id == user_b_id)
                    & (UserBlock.blocked_user_id == user_a_id),
                )
            )
            .first()
        )
        if block is not None:
            raise HTTPException(
                status_code=403,
                detail="This interaction is not available",
            )

    def block_user(
        self,
        db: Session,
        current_user: User,
        blocked_user_id: UUID,
    ) -> bool:
        if blocked_user_id == current_user.id:
            raise HTTPException(status_code=409, detail="You cannot block yourself")

        target = db.query(User).filter(User.id == blocked_user_id).first()
        if target is None:
            raise HTTPException(status_code=404, detail="User not found")

        existing = (
            db.query(UserBlock)
            .filter(
                UserBlock.blocker_id == current_user.id,
                UserBlock.blocked_user_id == blocked_user_id,
            )
            .first()
        )
        if existing is None:
            try:
                with db.begin_nested():
                    db.add(
                        UserBlock(
                            blocker_id=current_user.id,
                            blocked_user_id=blocked_user_id,
                        )
                    )
                    db.flush()
            except IntegrityError:
                # Dos pulsaciones simultáneas siguen siendo idempotentes.
                existing = (
                    db.query(UserBlock)
                    .filter(
                        UserBlock.blocker_id == current_user.id,
                        UserBlock.blocked_user_id == blocked_user_id,
                    )
                    .first()
                )

        now = datetime.now(timezone.utc)
        (
            db.query(UserConnection)
            .filter(
                or_(
                    (UserConnection.requester_id == current_user.id)
                    & (UserConnection.recipient_id == blocked_user_id),
                    (UserConnection.requester_id == blocked_user_id)
                    & (UserConnection.recipient_id == current_user.id),
                ),
                UserConnection.status.in_(
                    [
                        UserConnectionStatus.PENDING,
                        UserConnectionStatus.ACCEPTED,
                    ]
                ),
            )
            .update(
                {
                    UserConnection.status: UserConnectionStatus.CANCELLED,
                    UserConnection.cancelled_at: now,
                },
                synchronize_session=False,
            )
        )

        db.query(SavedUserProfile).filter(
            or_(
                (SavedUserProfile.user_id == current_user.id)
                & (SavedUserProfile.saved_user_id == blocked_user_id),
                (SavedUserProfile.user_id == blocked_user_id)
                & (SavedUserProfile.saved_user_id == current_user.id),
            )
        ).delete(synchronize_session=False)

        db.commit()
        return True

    def unblock_user(
        self,
        db: Session,
        current_user: User,
        blocked_user_id: UUID,
    ) -> bool:
        block = (
            db.query(UserBlock)
            .filter(
                UserBlock.blocker_id == current_user.id,
                UserBlock.blocked_user_id == blocked_user_id,
            )
            .first()
        )
        if block is not None:
            db.delete(block)
            db.commit()
        return False

    def list_blocked_users(
        self,
        db: Session,
        current_user: User,
    ) -> list[dict]:
        rows = (
            db.query(UserBlock, User)
            .join(User, User.id == UserBlock.blocked_user_id)
            .filter(UserBlock.blocker_id == current_user.id)
            .order_by(UserBlock.created_at.desc())
            .all()
        )
        return [
            {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "avatar_storage_key": user.avatar_storage_key,
                "blocked_at": block.created_at,
            }
            for block, user in rows
        ]

    def report_user(
        self,
        db: Session,
        current_user: User,
        reported_user_id: UUID,
        data: UserReportCreate,
    ) -> UserReport:
        if reported_user_id == current_user.id:
            raise HTTPException(status_code=409, detail="You cannot report yourself")

        target = db.query(User).filter(User.id == reported_user_id).first()
        if target is None:
            raise HTTPException(status_code=404, detail="User not found")

        report = UserReport(
            reporter_id=current_user.id,
            reported_user_id=reported_user_id,
            reason=data.reason,
            details=data.details.strip() if data.details else None,
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return report
