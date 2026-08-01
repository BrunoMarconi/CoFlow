from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database.models.community import Community
from app.database.models.community_member import (
    CommunityMember,
    CommunityMemberRole,
)
from app.database.models.user import User
from app.schemas.community_rent_split import (
    CommunityMemberContributionResponse,
    CommunityRentSplitResponse,
    CommunityRentSplitUpdate,
)


def _compute_percentage(
    contribution: int | None,
    total: int | None,
) -> float | None:
    if contribution is None or total is None or total <= 0:
        return None

    return round((contribution / total) * 100, 1)


class CommunityRentSplitService:

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

    def _ensure_active_membership(
        self,
        db: Session,
        community_id: int,
        user: User,
    ) -> CommunityMember:
        self._get_active_community(db, community_id)

        membership = (
            db.query(CommunityMember)
            .filter(
                CommunityMember.community_id == community_id,
                CommunityMember.user_id == user.id,
            )
            .first()
        )

        if membership is None:
            raise HTTPException(
                status_code=403,
                detail=(
                    "Only active members can access this "
                    "community's rent split"
                ),
            )

        return membership

    def _build_response(
        self,
        db: Session,
        community_id: int,
    ) -> CommunityRentSplitResponse:
        community = self._get_active_community(db, community_id)

        members = (
            db.query(CommunityMember)
            .options(joinedload(CommunityMember.user))
            .filter(
                CommunityMember.community_id == community_id,
            )
            .order_by(
                CommunityMember.role.desc(),
                CommunityMember.joined_at.asc(),
            )
            .all()
        )

        total_configured = sum(
            member.monthly_contribution
            for member in members
            if member.monthly_contribution is not None
        )

        remaining_amount = (
            community.total_monthly_rent - total_configured
            if community.total_monthly_rent is not None
            else None
        )

        contributions = [
            CommunityMemberContributionResponse(
                member_id=member.id,
                user_id=member.user_id,
                first_name=member.user.first_name,
                last_name=member.user.last_name,
                role=member.role,
                monthly_contribution=member.monthly_contribution,
                contribution_percentage=_compute_percentage(
                    member.monthly_contribution,
                    community.total_monthly_rent,
                ),
            )
            for member in members
        ]

        return CommunityRentSplitResponse(
            total_monthly_rent=community.total_monthly_rent,
            total_configured=total_configured,
            remaining_amount=remaining_amount,
            contributions=contributions,
        )

    def get_rent_split(
        self,
        db: Session,
        community_id: int,
        current_user: User,
    ) -> CommunityRentSplitResponse:
        self._ensure_active_membership(db, community_id, current_user)

        return self._build_response(db, community_id)

    def update_rent_split(
        self,
        db: Session,
        community_id: int,
        current_user: User,
        data: CommunityRentSplitUpdate,
    ) -> CommunityRentSplitResponse:
        membership = self._ensure_active_membership(
            db,
            community_id,
            current_user,
        )

        if membership.role != CommunityMemberRole.OWNER:
            raise HTTPException(
                status_code=403,
                detail=(
                    "Only the owner can edit this "
                    "community's rent split"
                ),
            )

        community = self._get_active_community(db, community_id)

        member_ids = [
            contribution.member_id
            for contribution in data.contributions
        ]

        if len(member_ids) != len(set(member_ids)):
            raise HTTPException(
                status_code=422,
                detail="Duplicate member_id in contributions",
            )

        members_by_id = {
            member.id: member
            for member in (
                db.query(CommunityMember)
                .filter(
                    CommunityMember.community_id == community_id,
                )
                .all()
            )
        }

        for contribution in data.contributions:
            if contribution.member_id not in members_by_id:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        "member_id does not belong to this community"
                    ),
                )

        try:
            community.total_monthly_rent = data.total_monthly_rent

            for contribution in data.contributions:
                member = members_by_id[contribution.member_id]
                member.monthly_contribution = (
                    contribution.monthly_contribution
                )

            db.commit()

        except Exception:
            db.rollback()
            raise

        return self._build_response(db, community_id)
