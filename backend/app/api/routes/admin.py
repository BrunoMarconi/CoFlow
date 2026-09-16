from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from app.core.dependencies import require_team_member
from app.database.models.admin_match_review import AdminMatchReview, AdminMatchReviewStatus
from app.database.models.community import Community, CommunityFormationStatus
from app.database.models.community_member import CommunityMember
from app.database.models.user import User, UserAdminStatus
from app.database.session import get_db
from app.schemas.admin import (
    AdminCommunityCandidate,
    AdminCommunityMember,
    AdminCommunityStatusUpdate,
    AdminCommunitySummary,
    AdminMatchAction,
    AdminMatchActionResponse,
    AdminMatchSuggestion,
    AdminUserDetail,
    AdminUserListResponse,
    AdminUserStatusUpdate,
    AdminUserSummary,
)
from app.services.admin_matching_service import calculate_match

router = APIRouter(dependencies=[Depends(require_team_member)])


def _user_query(db: Session):
    return db.query(User).options(
        selectinload(User.compatibility_profile),
        selectinload(User.community_memberships).selectinload(CommunityMember.community),
    ).filter(User.role == "USER")


def _active_community_name(user: User) -> str | None:
    membership = next((item for item in user.community_memberships if item.community.is_active), None)
    return membership.community.name if membership else None


def _completion(user: User) -> int:
    value = 55 if user.onboarding_completed else 0
    value += 15 if user.rental_budget is not None else 0
    value += 10 if user.age is not None or user.birth_date is not None else 0
    value += 10 if user.bio else 0
    value += 10 if user.interests else 0
    return value


def _summary(user: User, suggested_matches: int = 0) -> AdminUserSummary:
    return AdminUserSummary(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        avatar_url=user.avatar_url,
        age=user.age,
        occupation=user.occupation,
        rental_budget=user.rental_budget,
        admin_status=user.admin_status,
        onboarding_completed=user.onboarding_completed,
        profile_completion=_completion(user),
        suggested_matches=suggested_matches,
        community_name=_active_community_name(user),
        created_at=user.created_at,
    )


def _candidate_users(db: Session) -> list[User]:
    return _user_query(db).order_by(User.created_at.desc()).all()


@router.get("/users", response_model=AdminUserListResponse)
def list_users(
    q: str | None = Query(default=None, max_length=120),
    status: UserAdminStatus | None = None,
    db: Session = Depends(get_db),
):
    query = _user_query(db)
    if q:
        needle = f"%{q.strip()}%"
        query = query.filter(or_(User.first_name.ilike(needle), User.last_name.ilike(needle), User.email.ilike(needle)))
    if status:
        query = query.filter(User.admin_status == status)
    users = query.order_by(User.created_at.desc()).all()
    pool = _candidate_users(db)
    items = []
    for user in users:
        count = sum(1 for candidate in pool if candidate.id != user.id and calculate_match(user, candidate).eligible)
        items.append(_summary(user, count))
    counts = {value.value: 0 for value in UserAdminStatus}
    for user in pool:
        counts[user.admin_status.value] += 1
    return AdminUserListResponse(items=items, total=len(items), status_counts=counts)


@router.get("/users/{user_id}", response_model=AdminUserDetail)
def get_user(user_id: UUID, db: Session = Depends(get_db)):
    user = _user_query(db).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    reviews = {
        review.candidate_user_id: review.status
        for review in db.query(AdminMatchReview).filter(AdminMatchReview.user_id == user.id).all()
    }
    matches = []
    for candidate in _candidate_users(db):
        if candidate.id == user.id:
            continue
        result = calculate_match(user, candidate)
        matches.append(AdminMatchSuggestion(
            user=_summary(candidate), score=result.score, eligible=result.eligible,
            hard_filters=result.hard_filters, factors=result.factors,
            shared_interests=result.shared_interests, review_status=reviews.get(candidate.id),
        ))
    matches.sort(key=lambda item: (item.eligible, item.score), reverse=True)
    profile = user.compatibility_profile
    habits = {
        key: getattr(profile, key)
        for key in [
            "cleanliness", "dishes", "common_objects", "noise", "visits", "sleepovers",
            "wake_up", "night_noise", "smoking", "alcohol", "pets", "bills", "food",
            "communication", "conflicts", "rules", "culture", "space", "lifestyle",
        ]
    } if profile else {}
    return AdminUserDetail(
        user=_summary(user, sum(1 for item in matches if item.eligible)),
        phone=user.phone, bio=user.bio, interests=user.interests, habits=habits,
        hard_filter_data={"budget": user.rental_budget, "zone": None, "move_in_date": None},
        matches=matches,
    )


@router.patch("/users/{user_id}/status", response_model=AdminUserSummary)
def update_user_status(user_id: UUID, data: AdminUserStatusUpdate, db: Session = Depends(get_db)):
    user = _user_query(db).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    user.admin_status = data.status
    db.commit()
    db.refresh(user)
    return _summary(user)


@router.put("/users/{user_id}/matches/{candidate_id}", response_model=AdminMatchActionResponse)
def review_match(user_id: UUID, candidate_id: UUID, data: AdminMatchAction, db: Session = Depends(get_db)):
    if user_id == candidate_id:
        raise HTTPException(status_code=400, detail="A user cannot match with themselves")
    users = _user_query(db).filter(User.id.in_([user_id, candidate_id])).all()
    if len(users) != 2:
        raise HTTPException(status_code=404, detail="User not found")
    status = {
        "SAVE": AdminMatchReviewStatus.SAVED,
        "DISMISS": AdminMatchReviewStatus.DISMISSED,
        "PROPOSE": AdminMatchReviewStatus.PROPOSED,
    }[data.action]
    review = db.query(AdminMatchReview).filter(
        AdminMatchReview.user_id == user_id, AdminMatchReview.candidate_user_id == candidate_id
    ).first()
    if review:
        review.status = status
    else:
        review = AdminMatchReview(user_id=user_id, candidate_user_id=candidate_id, status=status)
        db.add(review)
    if status == AdminMatchReviewStatus.PROPOSED:
        primary = next(user for user in users if user.id == user_id)
        if primary.admin_status in {UserAdminStatus.NEW, UserAdminStatus.INCOMPLETE, UserAdminStatus.LOOKING}:
            primary.admin_status = UserAdminStatus.MATCH_FOUND
    db.commit()
    return AdminMatchActionResponse(status=status)


@router.get("/communities", response_model=list[AdminCommunitySummary])
def list_communities(db: Session = Depends(get_db)):
    communities = db.query(Community).options(
        selectinload(Community.members).selectinload(CommunityMember.user).selectinload(User.compatibility_profile)
    ).filter(Community.is_active.is_(True)).order_by(Community.updated_at.desc()).all()
    pool = _candidate_users(db)
    result = []
    for community in communities:
        member_ids = {member.user_id for member in community.members}
        candidates = []
        for candidate in pool:
            if candidate.id in member_ids or _active_community_name(candidate) or not candidate.is_looking_for_roommates:
                continue
            comparisons = [calculate_match(member.user, candidate) for member in community.members]
            if not comparisons:
                continue
            eligible = all(comparison.eligible for comparison in comparisons)
            score = round(sum(comparison.score for comparison in comparisons) / len(comparisons))
            best_factors = sorted(comparisons[0].factors, key=lambda item: item.score, reverse=True)[:2]
            reasons = [f"{factor.label}: {factor.score}%" for factor in best_factors]
            if community.monthly_rent and candidate.rental_budget:
                within_budget = candidate.rental_budget >= community.monthly_rent
                eligible = eligible and within_budget
                reasons.append("Presupuesto compatible" if within_budget else "Presupuesto insuficiente")
            candidates.append(AdminCommunityCandidate(user=_summary(candidate), score=score, eligible=eligible, reasons=reasons))
        candidates.sort(key=lambda item: (item.eligible, item.score), reverse=True)
        result.append(AdminCommunitySummary(
            id=community.id, name=community.name, city=community.city, neighborhood=community.neighborhood,
            max_members=community.max_members, open_spots=community.open_spots,
            move_in_date=community.move_in_date, monthly_rent=community.monthly_rent,
            formation_status=community.formation_status,
            members=[AdminCommunityMember(
                id=member.user.id, first_name=member.user.first_name, last_name=member.user.last_name,
                avatar_url=member.user.avatar_url, role=member.role.value,
            ) for member in community.members],
            candidates=candidates[:6], created_at=community.created_at,
        ))
    return result


@router.patch("/communities/{community_id}/status", response_model=AdminCommunitySummary)
def update_community_status(community_id: int, data: AdminCommunityStatusUpdate, db: Session = Depends(get_db)):
    community = db.query(Community).options(
        selectinload(Community.members).selectinload(CommunityMember.user)
    ).filter(Community.id == community_id).first()
    if community is None:
        raise HTTPException(status_code=404, detail="Community not found")
    community.formation_status = data.status
    db.commit()
    db.refresh(community)
    return AdminCommunitySummary(
        id=community.id, name=community.name, city=community.city, neighborhood=community.neighborhood,
        max_members=community.max_members, open_spots=community.open_spots,
        move_in_date=community.move_in_date, monthly_rent=community.monthly_rent,
        formation_status=community.formation_status,
        members=[AdminCommunityMember(id=m.user.id, first_name=m.user.first_name, last_name=m.user.last_name, avatar_url=m.user.avatar_url, role=m.role.value) for m in community.members],
        candidates=[], created_at=community.created_at,
    )
