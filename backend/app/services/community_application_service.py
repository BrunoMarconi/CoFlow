from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.database.models.community import Community, CommunityJoinType
from app.database.models.community_application import (
    CommunityApplication,
    CommunityApplicationStatus,
)
from app.database.models.community_member import (
    CommunityMember,
    CommunityMemberRole,
)
from app.database.models.notification import NotificationType
from app.database.models.user import User
from app.schemas.community_application import CommunityApplicationCreate
from app.services.notification_service import create_notification


class CommunityApplicationService:

    def _get_active_community(
        self,
        db: Session,
        community_id: int,
    ) -> Community:
        community = (
            db.query(Community)
            .filter(
                Community.id == community_id,
                Community.is_active.is_(True),
            )
            .first()
        )

        if community is None:
            raise HTTPException(
                status_code=404,
                detail="Community not found",
            )

        return community

    def _member_count(self, db: Session, community_id: int) -> int:
        return (
            db.query(func.count(CommunityMember.id))
            .filter(CommunityMember.community_id == community_id)
            .scalar()
            or 0
        )

    def create_application(
        self,
        db: Session,
        current_user: User,
        community_id: int,
        data: CommunityApplicationCreate,
    ) -> CommunityApplication:
        community = self._get_active_community(db, community_id)

        if community.owner_id == current_user.id:
            raise HTTPException(
                status_code=409,
                detail="You already own this community",
            )

        if community.join_type != CommunityJoinType.REQUEST:
            raise HTTPException(
                status_code=409,
                detail="This community does not require an application",
            )

        if community.open_spots <= 0:
            raise HTTPException(
                status_code=409,
                detail="This community is not currently looking for members",
            )

        member_count = self._member_count(db, community.id)

        if member_count >= community.max_members:
            raise HTTPException(
                status_code=409,
                detail="This community is full",
            )

        active_membership = (
            db.query(CommunityMember)
            .join(
                Community,
                Community.id == CommunityMember.community_id,
            )
            .filter(
                CommunityMember.user_id == current_user.id,
                Community.is_active.is_(True),
            )
            .first()
        )

        if active_membership is not None:
            raise HTTPException(
                status_code=409,
                detail="You already belong to another active community",
            )

        existing_pending = (
            db.query(CommunityApplication)
            .filter(
                CommunityApplication.community_id == community.id,
                CommunityApplication.applicant_id == current_user.id,
                CommunityApplication.status
                == CommunityApplicationStatus.PENDING,
            )
            .first()
        )

        if existing_pending is not None:
            raise HTTPException(
                status_code=409,
                detail="You already have a pending application "
                "for this community",
            )

        application = CommunityApplication(
            community_id=community.id,
            applicant_id=current_user.id,
            message=data.message,
        )

        try:
            db.add(application)

            create_notification(
                db=db,
                user_id=community.owner_id,
                type=NotificationType.COMMUNITY_APPLICATION_RECEIVED,
                title="Nueva solicitud recibida",
                message=(
                    f"{current_user.first_name} {current_user.last_name} "
                    f"quiere unirse a {community.name}."
                ),
                link="/mi-comunidad",
            )

            db.commit()
            db.refresh(application)

        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=409,
                detail="You already have a pending application "
                "for this community",
            )

        except Exception:
            db.rollback()
            raise

        return (
            db.query(CommunityApplication)
            .options(
                joinedload(
                    CommunityApplication.applicant
                ).joinedload(User.compatibility_profile)
            )
            .filter(CommunityApplication.id == application.id)
            .first()
        )

    def list_applications(
        self,
        db: Session,
        current_user: User,
        community_id: int,
    ) -> list[CommunityApplication]:
        community = self._get_active_community(db, community_id)

        if community.owner_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Only the owner can view applications",
            )

        return (
            db.query(CommunityApplication)
            .options(
                joinedload(
                    CommunityApplication.applicant
                ).joinedload(User.compatibility_profile)
            )
            .filter(CommunityApplication.community_id == community_id)
            .order_by(CommunityApplication.created_at.desc())
            .all()
        )

    def list_my_applications(
        self,
        db: Session,
        current_user: User,
    ) -> list[CommunityApplication]:
        return (
            db.query(CommunityApplication)
            .options(
                joinedload(
                    CommunityApplication.applicant
                ).joinedload(User.compatibility_profile)
            )
            .filter(CommunityApplication.applicant_id == current_user.id)
            .order_by(CommunityApplication.created_at.desc())
            .all()
        )

    def _get_application_for_review(
        self,
        db: Session,
        application_id: int,
    ) -> CommunityApplication:
        application = (
            db.query(CommunityApplication)
            .options(
                joinedload(
                    CommunityApplication.applicant
                ).joinedload(User.compatibility_profile)
            )
            .filter(CommunityApplication.id == application_id)
            .first()
        )

        if application is None:
            raise HTTPException(
                status_code=404,
                detail="Application not found",
            )

        return application

    def accept_application(
        self,
        db: Session,
        current_user: User,
        application_id: int,
    ) -> CommunityApplication:
        application = self._get_application_for_review(db, application_id)

        community = self._get_active_community(
            db, application.community_id
        )

        if community.owner_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Only the owner can accept applications",
            )

        if application.status != CommunityApplicationStatus.PENDING:
            raise HTTPException(
                status_code=409,
                detail="This application is no longer pending",
            )

        active_membership = (
            db.query(CommunityMember)
            .join(
                Community,
                Community.id == CommunityMember.community_id,
            )
            .filter(
                CommunityMember.user_id == application.applicant_id,
                Community.is_active.is_(True),
            )
            .first()
        )

        if active_membership is not None:
            raise HTTPException(
                status_code=409,
                detail="The applicant already belongs to an "
                "active community",
            )

        try:
            # Bloqueamos la fila de la comunidad para que dos
            # aceptaciones concurrentes (dos solicitudes distintas)
            # no consuman la misma última plaza.
            locked_community = (
                db.query(Community)
                .filter(Community.id == community.id)
                .with_for_update()
                .one()
            )

            if locked_community.open_spots <= 0:
                raise HTTPException(
                    status_code=409,
                    detail="This community is not currently looking "
                    "for members",
                )

            member_count = self._member_count(
                db, locked_community.id
            )

            if member_count >= locked_community.max_members:
                raise HTTPException(
                    status_code=409,
                    detail="This community is full",
                )

            db.add(
                CommunityMember(
                    community_id=locked_community.id,
                    user_id=application.applicant_id,
                    role=CommunityMemberRole.MEMBER,
                )
            )

            locked_community.open_spots -= 1

            application.status = CommunityApplicationStatus.ACCEPTED
            application.reviewed_at = datetime.now(timezone.utc)
            application.reviewed_by_id = current_user.id

            create_notification(
                db=db,
                user_id=application.applicant_id,
                type=NotificationType.COMMUNITY_APPLICATION_ACCEPTED,
                title="Solicitud aceptada",
                message=f"Tu solicitud para unirte a {community.name} "
                "ha sido aceptada.",
                link="/mi-comunidad",
            )

            db.commit()

        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=409,
                detail="The applicant already belongs to this community",
            )

        except Exception:
            db.rollback()
            raise

        db.refresh(application)

        return application

    def reject_application(
        self,
        db: Session,
        current_user: User,
        application_id: int,
    ) -> CommunityApplication:
        application = self._get_application_for_review(db, application_id)

        community = self._get_active_community(
            db, application.community_id
        )

        if community.owner_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Only the owner can reject applications",
            )

        if application.status != CommunityApplicationStatus.PENDING:
            raise HTTPException(
                status_code=409,
                detail="This application is no longer pending",
            )

        application.status = CommunityApplicationStatus.REJECTED
        application.reviewed_at = datetime.now(timezone.utc)
        application.reviewed_by_id = current_user.id

        create_notification(
            db=db,
            user_id=application.applicant_id,
            type=NotificationType.COMMUNITY_APPLICATION_REJECTED,
            title="Solicitud rechazada",
            message=f"Tu solicitud para unirte a {community.name} "
            "ha sido rechazada.",
            link="/comunidades",
        )

        db.commit()
        db.refresh(application)

        return application

    def cancel_application(
        self,
        db: Session,
        current_user: User,
        application_id: int,
    ) -> CommunityApplication:
        application = self._get_application_for_review(db, application_id)

        if application.applicant_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Only the applicant can cancel this application",
            )

        if application.status != CommunityApplicationStatus.PENDING:
            raise HTTPException(
                status_code=409,
                detail="This application is no longer pending",
            )

        application.status = CommunityApplicationStatus.CANCELLED
        application.cancelled_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(application)

        return application
