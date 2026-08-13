from app.database.models.notification import NotificationType
from app.services.notification_service import NotificationService, create_notification


notification_service = NotificationService()


def test_notification_counts_are_scoped_and_message_count_is_exact(
    db_session,
    make_user,
):
    recipient = make_user("notification_recipient")
    other = make_user("notification_other")

    create_notification(
        db_session,
        recipient.id,
        NotificationType.PRIVATE_MESSAGE_RECEIVED,
        "Mensaje nuevo",
        "Tienes un mensaje.",
        "/mensajes/12",
    )
    create_notification(
        db_session,
        recipient.id,
        NotificationType.CONNECTION_REQUEST_RECEIVED,
        "Solicitud nueva",
        "Alguien quiere conectar contigo.",
        "/conexiones",
    )
    create_notification(
        db_session,
        other.id,
        NotificationType.PRIVATE_MESSAGE_RECEIVED,
        "Mensaje ajeno",
        "Esta notificación no pertenece al destinatario.",
        "/mensajes/99",
    )
    db_session.commit()

    assert notification_service.get_unread_count(db_session, recipient) == 2
    assert notification_service.get_unread_message_count(db_session, recipient) == 1
    assert len(notification_service.list_notifications(db_session, recipient)) == 2


def test_mark_link_read_only_updates_the_current_users_matching_notifications(
    db_session,
    make_user,
):
    recipient = make_user("notification_link_recipient")
    other = make_user("notification_link_other")
    link = "/mensajes/27"

    for user in (recipient, other):
        create_notification(
            db_session,
            user.id,
            NotificationType.PRIVATE_MESSAGE_RECEIVED,
            "Mensaje nuevo",
            "Tienes un mensaje.",
            link,
        )
    db_session.commit()

    assert notification_service.mark_link_read(db_session, recipient, link) == 1
    assert notification_service.get_unread_count(db_session, recipient) == 0
    assert notification_service.get_unread_count(db_session, other) == 1
