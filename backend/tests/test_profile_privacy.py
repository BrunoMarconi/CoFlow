import pytest
from fastapi import HTTPException

from app.database.models.user import ProfileVisibility
from app.database.models.user_connection import UserConnection, UserConnectionStatus
from app.services.user_service import UserService


user_service = UserService()


def test_connections_only_profile_is_hidden_from_strangers(db_session, make_user):
    owner = make_user("private_profile_owner")
    stranger = make_user("private_profile_stranger")
    owner.profile_visibility = ProfileVisibility.CONNECTIONS
    db_session.commit()

    with pytest.raises(HTTPException) as error:
        user_service.get_public_profile(db_session, owner.id, stranger)

    assert error.value.status_code == 404


def test_connections_only_profile_is_visible_to_accepted_connections(db_session, make_user):
    owner = make_user("connected_profile_owner")
    viewer = make_user("connected_profile_viewer")
    owner.profile_visibility = ProfileVisibility.CONNECTIONS
    db_session.add(UserConnection(requester_id=viewer.id, recipient_id=owner.id, status=UserConnectionStatus.ACCEPTED))
    db_session.commit()

    profile = user_service.get_public_profile(db_session, owner.id, viewer)

    assert profile.id == owner.id
