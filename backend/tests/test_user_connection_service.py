import pytest
from fastapi import HTTPException

from app.database.models.notification import Notification, NotificationType
from app.database.models.user_connection import UserConnectionStatus
from app.services.user_connection_service import UserConnectionService


service = UserConnectionService()


def test_connection_lifecycle_is_reflected_in_overview(
    db_session,
    make_user,
):
    requester = make_user("connection_requester")
    recipient = make_user("connection_recipient")

    pending = service.create_connection_request(
        db_session,
        requester,
        recipient.id,
    )

    requester_overview = service.get_overview(db_session, requester)
    recipient_overview = service.get_overview(db_session, recipient)

    assert [item.id for item in requester_overview["sent"]] == [pending.id]
    assert [item.id for item in recipient_overview["received"]] == [pending.id]
    assert requester_overview["accepted"] == []

    accepted = service.accept_connection(
        db_session,
        recipient,
        pending.id,
    )

    assert accepted.status == UserConnectionStatus.ACCEPTED
    assert accepted.responded_at is not None

    for user in (requester, recipient):
        overview = service.get_overview(db_session, user)
        assert [item.id for item in overview["accepted"]] == [pending.id]
        assert overview["received"] == []
        assert overview["sent"] == []

    service.delete_connection(db_session, requester, pending.id)

    assert service.get_overview(db_session, requester)["accepted"] == []
    assert service.get_overview(db_session, recipient)["accepted"] == []


def test_connection_request_prevents_duplicates_and_creates_notifications(
    db_session,
    make_user,
):
    requester = make_user("connection_duplicate_requester")
    recipient = make_user("connection_duplicate_recipient")

    connection = service.create_connection_request(
        db_session,
        requester,
        recipient.id,
    )

    with pytest.raises(HTTPException) as duplicate_error:
        service.create_connection_request(
            db_session,
            recipient,
            requester.id,
        )

    assert duplicate_error.value.status_code == 409

    received_notification = (
        db_session.query(Notification)
        .filter(
            Notification.user_id == recipient.id,
            Notification.type == NotificationType.CONNECTION_REQUEST_RECEIVED,
        )
        .one()
    )
    assert received_notification.link == "/conexiones?tab=recibidas"

    service.accept_connection(db_session, recipient, connection.id)

    accepted_notification = (
        db_session.query(Notification)
        .filter(
            Notification.user_id == requester.id,
            Notification.type == NotificationType.CONNECTION_REQUEST_ACCEPTED,
        )
        .one()
    )
    assert accepted_notification.link == f"/mensajes/{connection.id}"


def test_only_request_participants_can_change_a_pending_request(
    db_session,
    make_user,
):
    requester = make_user("connection_permissions_requester")
    recipient = make_user("connection_permissions_recipient")
    outsider = make_user("connection_permissions_outsider")
    connection = service.create_connection_request(
        db_session,
        requester,
        recipient.id,
    )

    with pytest.raises(HTTPException) as accept_error:
        service.accept_connection(db_session, outsider, connection.id)
    assert accept_error.value.status_code == 403

    with pytest.raises(HTTPException) as cancel_error:
        service.cancel_connection(db_session, recipient, connection.id)
    assert cancel_error.value.status_code == 403
