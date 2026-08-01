import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.models.community import Community
from app.database.models.community_invitation import (
    CommunityInvitation,
    CommunityInvitationStatus,
)
from app.database.models.community_member import (
    CommunityMember,
    CommunityMemberRole,
)
from app.database.models.user import User
from app.schemas.community_invitation import (
    CommunityInvitationCommunityResponse,
    CommunityInvitationDetailResponse,
)
from app.services.notification_service import create_notification
from app.database.models.notification import NotificationType

INVITATION_VALIDITY_DAYS = 7


class CommunityInvitationService:

    def _get_owned_active_community(
        self,
        db: Session,
        community_id: int,
        current_user: User,
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

        if community.owner_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Only the owner can manage invitations",
            )

        return community

    def create_invitation(
        self,
        db: Session,
        current_user: User,
        community_id: int,
    ) -> CommunityInvitation:
        self._get_owned_active_community(db, community_id, current_user)

        invitation = CommunityInvitation(
            community_id=community_id,
            invited_by_id=current_user.id,
            token=secrets.token_urlsafe(32),
            status=CommunityInvitationStatus.PENDING,
            expires_at=(
                datetime.now(timezone.utc)
                + timedelta(days=INVITATION_VALIDITY_DAYS)
            ),
        )

        try:
            db.add(invitation)
            db.commit()
            db.refresh(invitation)

        except Exception:
            db.rollback()
            raise

        return invitation

    def list_invitations(
        self,
        db: Session,
        current_user: User,
        community_id: int,
    ) -> list[CommunityInvitation]:
        self._get_owned_active_community(db, community_id, current_user)

        return (
            db.query(CommunityInvitation)
            .filter(
                CommunityInvitation.community_id == community_id,
            )
            .order_by(CommunityInvitation.created_at.desc())
            .all()
        )

    def cancel_invitation(
        self,
        db: Session,
        current_user: User,
        community_id: int,
        invitation_id: int,
    ) -> CommunityInvitation:
        self._get_owned_active_community(db, community_id, current_user)

        invitation = (
            db.query(CommunityInvitation)
            .filter(
                CommunityInvitation.id == invitation_id,
                CommunityInvitation.community_id == community_id,
            )
            .first()
        )

        if invitation is None:
            raise HTTPException(
                status_code=404,
                detail="Invitation not found",
            )

        if invitation.status != CommunityInvitationStatus.PENDING:
            raise HTTPException(
                status_code=409,
                detail="Only pending invitations can be cancelled",
            )

        invitation.status = CommunityInvitationStatus.CANCELLED
        invitation.cancelled_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(invitation)

        return invitation

    def _get_invitation_by_token(
        self,
        db: Session,
        token: str,
    ) -> CommunityInvitation:
        invitation = (
            db.query(CommunityInvitation)
            .filter(CommunityInvitation.token == token)
            .first()
        )

        if invitation is None:
            raise HTTPException(
                status_code=404,
                detail="Invitation not found",
            )

        if (
            invitation.status == CommunityInvitationStatus.PENDING
            and invitation.expires_at < datetime.now(timezone.utc)
        ):
            invitation.status = CommunityInvitationStatus.EXPIRED
            db.commit()
            db.refresh(invitation)

        return invitation

    def get_invitation_detail(
        self,
        db: Session,
        token: str,
    ) -> CommunityInvitationDetailResponse:
        invitation = self._get_invitation_by_token(db, token)

        community = (
            db.query(Community)
            .filter(Community.id == invitation.community_id)
            .first()
        )

        if community is None:
            raise HTTPException(
                status_code=404,
                detail="Community not found",
            )

        owner = (
            db.query(User)
            .filter(User.id == community.owner_id)
            .first()
        )

        member_count = (
            db.query(func.count(CommunityMember.id))
            .filter(CommunityMember.community_id == community.id)
            .scalar()
            or 0
        )

        return CommunityInvitationDetailResponse(
            status=invitation.status,
            expires_at=invitation.expires_at,
            community=CommunityInvitationCommunityResponse(
                id=community.id,
                name=community.name,
                city=community.city,
                member_count=member_count,
                owner_first_name=owner.first_name if owner else "",
                owner_last_name=owner.last_name if owner else "",
            ),
        )

    def accept_invitation(
        self,
        db: Session,
        current_user: User,
        token: str,
    ) -> CommunityInvitation:
        invitation = self._get_invitation_by_token(db, token)

        if invitation.status != CommunityInvitationStatus.PENDING:
            raise HTTPException(
                status_code=409,
                detail="This invitation is no longer available",
            )

        community = (
            db.query(Community)
            .filter(
                Community.id == invitation.community_id,
                Community.is_active.is_(True),
            )
            .first()
        )

        if community is None:
            raise HTTPException(
                status_code=404,
                detail="Community not found",
            )

        if community.owner_id == current_user.id:
            raise HTTPException(
                status_code=409,
                detail="The owner cannot accept their own invitation",
            )

        existing_membership = (
            db.query(CommunityMember)
            .filter(
                CommunityMember.community_id == community.id,
                CommunityMember.user_id == current_user.id,
            )
            .first()
        )

        if existing_membership is not None:
            raise HTTPException(
                status_code=409,
                detail="You are already a member of this community",
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

        try:
            # Bloqueamos la fila de la comunidad para que dos
            # aceptaciones concurrentes no superen max_members.
            # Aceptar una invitación no toca open_spots, pero sí
            # comparte con las solicitudes el límite de capacidad.
            locked_community = (
                db.query(Community)
                .filter(Community.id == community.id)
                .with_for_update()
                .one()
            )

            member_count = (
                db.query(func.count(CommunityMember.id))
                .filter(
                    CommunityMember.community_id == locked_community.id
                )
                .scalar()
                or 0
            )

            if member_count >= locked_community.max_members:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "This community has reached "
                        "its maximum capacity"
                    ),
                )

            db.add(
                CommunityMember(
                    community_id=locked_community.id,
                    user_id=current_user.id,
                    role=CommunityMemberRole.MEMBER,
                )
            )

            invitation.status = CommunityInvitationStatus.ACCEPTED
            invitation.accepted_by_id = current_user.id
            invitation.accepted_at = datetime.now(timezone.utc)

            create_notification(
                db=db,
                user_id=community.owner_id,
                type=NotificationType.COMMUNITY_INVITATION_ACCEPTED,
                title="Invitación aceptada",
                message=(
                    f"{current_user.first_name} {current_user.last_name} "
                    "ha aceptado tu invitación y ya forma parte de "
                    f"{community.name}."
                ),
                link="/mi-comunidad",
            )

            db.commit()

        except Exception:
            db.rollback()
            raise

        db.refresh(invitation)

        return invitation

    def decline_invitation(
        self,
        db: Session,
        current_user: User,
        token: str,
    ) -> CommunityInvitation:
        invitation = self._get_invitation_by_token(db, token)

        if invitation.status != CommunityInvitationStatus.PENDING:
            raise HTTPException(
                status_code=409,
                detail="This invitation is no longer available",
            )

        invitation.status = CommunityInvitationStatus.DECLINED

        db.commit()
        db.refresh(invitation)

        return invitation
