from sqlalchemy.orm import Session, joinedload

from app.database.models.notification import NotificationType
from app.database.models.private_message import PrivateMessage
from app.database.models.user import User
from app.database.models.user_connection import UserConnection
from app.schemas.private_message import PrivateMessageCreate
from app.services.notification_service import create_notification
from app.services.user_connection_service import UserConnectionService

MAX_LIMIT = 100

user_connection_service = UserConnectionService()


class PrivateMessageService:

    def get_messages(
        self,
        db: Session,
        current_user: User,
        connection_id: int,
        skip: int = 0,
        limit: int = 50,
    ) -> list[PrivateMessage]:
        user_connection_service.ensure_participant(
            db, current_user, connection_id
        )

        limit = min(max(limit, 1), MAX_LIMIT)
        skip = max(skip, 0)

        messages = (
            db.query(PrivateMessage)
            .options(joinedload(PrivateMessage.sender))
            .filter(
                PrivateMessage.connection_id == connection_id,
                PrivateMessage.is_deleted.is_(False),
            )
            .order_by(PrivateMessage.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        return list(reversed(messages))

    def create_message(
        self,
        db: Session,
        current_user: User,
        connection_id: int,
        data: PrivateMessageCreate,
    ) -> PrivateMessage:
        connection = user_connection_service.ensure_participant(
            db, current_user, connection_id
        )

        recipient_id = (
            connection.recipient_id
            if connection.requester_id == current_user.id
            else connection.requester_id
        )

        message = PrivateMessage(
            connection_id=connection_id,
            sender_id=current_user.id,
            content=data.content,
        )

        try:
            db.add(message)

            create_notification(
                db=db,
                user_id=recipient_id,
                type=NotificationType.PRIVATE_MESSAGE_RECEIVED,
                title="Nuevo mensaje privado",
                message=(
                    f"{current_user.first_name} te ha enviado un mensaje."
                ),
                link=f"/mensajes/{connection_id}",
            )

            db.commit()
            db.refresh(message)

        except Exception:
            db.rollback()
            raise

        return (
            db.query(PrivateMessage)
            .options(joinedload(PrivateMessage.sender))
            .filter(PrivateMessage.id == message.id)
            .first()
        )
