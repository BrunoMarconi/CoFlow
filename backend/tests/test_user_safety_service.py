from fastapi import HTTPException

from app.database.models.saved_user_profile import SavedUserProfile
from app.database.models.user_block import UserBlock
from app.database.models.user_connection import (
    UserConnection,
    UserConnectionStatus,
)
from app.schemas.user_safety import UserReportCreate
from app.services.user_safety_service import UserSafetyService


service = UserSafetyService()


def test_block_user_cancels_connection_and_saved_profiles(
    db_session,
    make_user,
):
    blocker = make_user("safety-blocker")
    target = make_user("safety-target")
    connection = UserConnection(
        requester_id=blocker.id,
        recipient_id=target.id,
        status=UserConnectionStatus.ACCEPTED,
    )
    db_session.add_all(
        [
            connection,
            SavedUserProfile(user_id=blocker.id, saved_user_id=target.id),
            SavedUserProfile(user_id=target.id, saved_user_id=blocker.id),
        ]
    )
    db_session.commit()

    assert service.block_user(db_session, blocker, target.id) is True

    db_session.refresh(connection)
    assert connection.status == UserConnectionStatus.CANCELLED
    assert connection.cancelled_at is not None
    assert (
        db_session.query(UserBlock)
        .filter(
            UserBlock.blocker_id == blocker.id,
            UserBlock.blocked_user_id == target.id,
        )
        .count()
        == 1
    )
    assert db_session.query(SavedUserProfile).count() == 0


def test_block_user_is_idempotent(db_session, make_user):
    blocker = make_user("safety-idempotent-blocker")
    target = make_user("safety-idempotent-target")

    service.block_user(db_session, blocker, target.id)
    service.block_user(db_session, blocker, target.id)

    assert (
        db_session.query(UserBlock)
        .filter(
            UserBlock.blocker_id == blocker.id,
            UserBlock.blocked_user_id == target.id,
        )
        .count()
        == 1
    )


def test_block_prevents_future_interactions(db_session, make_user):
    blocker = make_user("safety-prevent-blocker")
    target = make_user("safety-prevent-target")
    service.block_user(db_session, blocker, target.id)

    try:
        service.ensure_not_blocked_between(db_session, target.id, blocker.id)
    except HTTPException as error:
        assert error.status_code == 403
        assert error.detail == "This interaction is not available"
    else:
        raise AssertionError("Blocked users must not be able to interact")


def test_unblock_and_report_are_persisted(db_session, make_user):
    blocker = make_user("safety-unblock-blocker")
    target = make_user("safety-unblock-target")
    service.block_user(db_session, blocker, target.id)

    assert service.unblock_user(db_session, blocker, target.id) is False
    assert service.list_blocked_users(db_session, blocker) == []

    report = service.report_user(
        db_session,
        blocker,
        target.id,
        UserReportCreate(reason="SPAM", details="Mensaje repetido"),
    )
    assert report.reporter_id == blocker.id
    assert report.reported_user_id == target.id
    assert report.reason == "SPAM"
    assert report.details == "Mensaje repetido"
