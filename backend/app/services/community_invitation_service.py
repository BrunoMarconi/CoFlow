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
    CommunityInvitationCreate,
    CommunityInvitationCommunityResponse,
    CommunityInvitationDetailResponse,
    CommunityInvitationInboxResponse,
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
        data: CommunityInvitationCreate,
    ) -> CommunityInvitation:
        community = self._get_owned_active_community(
            db, community_id, current_user
        )

        member_count = (
            db.query(func.count(CommunityMember.id))
            .filter(CommunityMember.community_id == community.id)
            .scalar()
            or 0
        )
        if member_count >= community.max_members:
            raise HTTPException(
                status_code=409,
                detail="This community has reached its maximum capacity",
            )

        # Mismo criterio que community_application_service: si el
        # propietario marcó la comunidad como "sin plazas abiertas" no
        # tiene sentido dejarle crear invitaciones directas que lo
        # saltan — antes esto solo se comprobaba para solicitudes, no
        # para invitaciones directas.
        if community.open_spots <= 0:
            raise HTTPException(
                status_code=409,
                detail="This community has no open spots right now",
            )

        if data.invited_user_id is not None:
            invited_user = (
                db.query(User)
                .filter(User.id == data.invited_user_id)
                .first()
            )
            if invited_user is None:
                raise HTTPException(status_code=404, detail="User not found")
            if invited_user.id == current_user.id:
                raise HTTPException(
                    status_code=409,
                    detail="You cannot invite yourself",
                )

            active_membership = (
                db.query(CommunityMember)
                .join(Community, Community.id == CommunityMember.community_id)
                .filter(
                    CommunityMember.user_id == invited_user.id,
                    Community.is_active.is_(True),
                )
                .first()
            )
            if active_membership is not None:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "This person already belongs to an active community"
                    ),
                )

            existing_pending = (
                db.query(CommunityInvitation)
                .filter(
                    CommunityInvitation.community_id == community.id,
                    CommunityInvitation.invited_user_id == invited_user.id,
                    CommunityInvitation.status
                    == CommunityInvitationStatus.PENDING,
                    CommunityInvitation.expires_at
                    >= datetime.now(timezone.utc),
                )
                .first()
            )
            if existing_pending is not None:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "This person already has a pending invitation "
                        "to this community"
                    ),
                )

        invitation = CommunityInvitation(
            community_id=community_id,
            invited_by_id=current_user.id,
            invited_user_id=data.invited_user_id,
            token=secrets.token_urlsafe(32),
            status=CommunityInvitationStatus.PENDING,
            expires_at=(
                datetime.now(timezone.utc)
                + timedelta(days=INVITATION_VALIDITY_DAYS)
            ),
        )

        try:
            db.add(invitation)

            if data.invited_user_id is not None:
                create_notification(
                    db=db,
                    user_id=data.invited_user_id,
                    type=NotificationType.COMMUNITY_INVITATION_RECEIVED,
                    title="Te han invitado a una comunidad",
                    message=(
                        f"{current_user.first_name} {current_user.last_name} "
                        f"te ha invitado a unirte a {community.name}."
                    ),
                    link=f"/invitaciones/{invitation.token}",
                )
            db.commit()
            db.refresh(invitation)

        except Exception:
            db.rollback()
            raise

        return invitation

    def list_received_invitations(
        self,
        db: Session,
        current_user: User,
    ) -> list[CommunityInvitationInboxResponse]:
        invitations = (
            db.query(CommunityInvitation)
            .filter(CommunityInvitation.invited_user_id == current_user.id)
            .order_by(CommunityInvitation.created_at.desc())
            .all()
        )

        return [
            self._build_inbox_response(db, item, current_user)
            for item in invitations
        ]

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
        current_user: User,
    ) -> CommunityInvitationDetailResponse:
        invitation = self._get_invitation_by_token(db, token)

        if (
            invitation.invited_user_id is not None
            and invitation.invited_user_id != current_user.id
            and invitation.invited_by_id != current_user.id
        ):
            raise HTTPException(
                status_code=403,
                detail="This invitation belongs to another person",
            )

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
                max_members=community.max_members,
                open_spots=community.open_spots,
            ),
        )

    def _build_inbox_response(
        self,
        db: Session,
        invitation: CommunityInvitation,
        current_user: User,
    ) -> CommunityInvitationInboxResponse:
        detail = self.get_invitation_detail(
            db,
            invitation.token,
            current_user,
        )
        return CommunityInvitationInboxResponse(
            id=invitation.id,
            token=invitation.token,
            status=detail.status,
            expires_at=detail.expires_at,
            created_at=invitation.created_at,
            community=detail.community,
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

        if (
            invitation.invited_user_id is not None
            and invitation.invited_user_id != current_user.id
        ):
            raise HTTPException(
                status_code=403,
                detail="This invitation is for another person",
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

            available_capacity = max(
                locked_community.max_members - (member_count + 1), 0
            )
            locked_community.open_spots = min(
                locked_community.open_spots,
                available_capacity,
            )

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

        if (
            invitation.invited_user_id is not None
            and invitation.invited_user_id != current_user.id
        ):
            raise HTTPException(
                status_code=403,
                detail="This invitation is for another person",
            )

        invitation.status = CommunityInvitationStatus.DECLINED

        db.commit()
        db.refresh(invitation)

        return invitation
