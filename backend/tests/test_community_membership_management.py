from fastapi import HTTPException
import pytest

from app.database.models.community import (
    CommunityJoinType,
    CommunityProfileType,
    CommunityUrgency,
)
from app.database.models.community_member import CommunityMemberRole
from app.schemas.community import CommunityCreate, CommunityPreferencesCreate
from app.schemas.community_invitation import CommunityInvitationCreate
from app.services.community_invitation_service import CommunityInvitationService
from app.services.community_service import CommunityService


community_service = CommunityService()
invitation_service = CommunityInvitationService()


def create_community(db_session, owner, *, max_members=4, open_spots=3):
    return community_service.create_community(
        db=db_session,
        current_user=owner,
        data=CommunityCreate(
            name="Casa de prueba",
            description="Una comunidad de prueba suficientemente descriptiva.",
            city="Málaga",
            max_members=max_members,
            open_spots=open_spots,
            join_type=CommunityJoinType.REQUEST,
            urgency=CommunityUrgency.NORMAL,
            profile_type=CommunityProfileType.MIXED,
            preferences=CommunityPreferencesCreate(
                cleanliness="Ordenada",
                atmosphere="Tranquila",
                visits="A veces",
                sleepovers="Con aviso",
                smoking="No fumar",
                pets="Aceptadas",
                rules="Hablarlo",
                lifestyle="Flexible",
            ),
        ),
    )


def invite_and_accept(db_session, owner, member, community):
    invitation = invitation_service.create_invitation(
        db_session,
        owner,
        community.id,
        CommunityInvitationCreate(invited_user_id=member.id),
    )
    invitation_service.accept_invitation(db_session, member, invitation.token)


def test_direct_invitation_is_private_and_joins_target(db_session, make_user):
    owner = make_user("invite_owner")
    invited = make_user("invite_target")
    outsider = make_user("invite_outsider")
    community = create_community(db_session, owner)

    invitation = invitation_service.create_invitation(
        db_session,
        owner,
        community.id,
        CommunityInvitationCreate(invited_user_id=invited.id),
    )

    inbox = invitation_service.list_received_invitations(db_session, invited)
    assert [item.id for item in inbox] == [invitation.id]

    with pytest.raises(HTTPException) as caught:
        invitation_service.get_invitation_detail(
            db_session,
            invitation.token,
            outsider,
        )
    assert caught.value.status_code == 403

    invitation_service.accept_invitation(db_session, invited, invitation.token)
    updated = community_service.get_community_by_id(
        db_session,
        community.id,
        invited,
    )
    assert updated.is_member is True
    assert updated.member_count == 2
    assert updated.open_spots == 2


def test_generic_invitation_remains_shareable(db_session, make_user):
    owner = make_user("generic_owner")
    invited = make_user("generic_target")
    community = create_community(db_session, owner)
    invitation = invitation_service.create_invitation(
        db_session,
        owner,
        community.id,
        CommunityInvitationCreate(),
    )

    detail = invitation_service.get_invitation_detail(
        db_session,
        invitation.token,
        invited,
    )
    assert detail.community.id == community.id

    invitation_service.accept_invitation(db_session, invited, invitation.token)
    updated = community_service.get_community_by_id(
        db_session,
        community.id,
        invited,
    )
    assert updated.is_member is True


def test_direct_invitation_rejects_duplicate(db_session, make_user):
    owner = make_user("duplicate_owner")
    invited = make_user("duplicate_target")
    community = create_community(db_session, owner)
    payload = CommunityInvitationCreate(invited_user_id=invited.id)

    invitation_service.create_invitation(db_session, owner, community.id, payload)

    with pytest.raises(HTTPException) as caught:
        invitation_service.create_invitation(db_session, owner, community.id, payload)
    assert caught.value.status_code == 409


def test_owner_can_remove_member(db_session, make_user):
    owner = make_user("remove_owner")
    member = make_user("remove_member")
    community = create_community(db_session, owner)
    invite_and_accept(db_session, owner, member, community)

    updated = community_service.remove_member(
        db_session,
        owner,
        community.id,
        member.id,
    )
    assert updated.member_count == 1
    assert all(item.user_id != member.id for item in updated.members)


def test_owner_can_transfer_ownership(db_session, make_user):
    owner = make_user("transfer_owner")
    member = make_user("transfer_member")
    community = create_community(db_session, owner)
    invite_and_accept(db_session, owner, member, community)

    updated = community_service.transfer_ownership(
        db_session,
        owner,
        community.id,
        member.id,
    )
    roles = {item.user_id: item.role for item in updated.members}
    assert updated.owner_id == member.id
    assert roles[member.id] == CommunityMemberRole.OWNER
    assert roles[owner.id] == CommunityMemberRole.MEMBER


def test_non_owner_cannot_manage_members(db_session, make_user):
    owner = make_user("forbidden_owner")
    member = make_user("forbidden_member")
    other = make_user("forbidden_other")
    community = create_community(db_session, owner)
    invite_and_accept(db_session, owner, member, community)
    invite_and_accept(db_session, owner, other, community)

    with pytest.raises(HTTPException) as caught:
        community_service.remove_member(
            db_session,
            member,
            community.id,
            other.id,
        )
    assert caught.value.status_code == 403
