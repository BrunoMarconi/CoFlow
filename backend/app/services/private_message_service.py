from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.database.models.notification import NotificationType
from app.database.models.private_message import PrivateMessage
from app.database.models.user import User
from app.schemas.private_message import PrivateMessageCreate
from app.services.notification_service import create_notification
from app.services.user_connection_service import UserConnectionService

MAX_LIMIT = 100

user_connection_service = UserConnectionService()


class PrivateMessageService:

    def get_conversation_summaries(
        self,
        db: Session,
        current_user: User,
    ) -> list[dict]:
        connections = user_connection_service.list_connections(
            db=db,
            current_user=current_user,
        )

        if not connections:
            return []

        connection_ids = [connection.id for connection in connections]
        latest_message_ids = (
            db.query(func.max(PrivateMessage.id))
            .filter(
                PrivateMessage.connection_id.in_(connection_ids),
                PrivateMessage.is_deleted.is_(False),
            )
            .group_by(PrivateMessage.connection_id)
            .all()
        )
        message_ids = [message_id for (message_id,) in latest_message_ids]

        latest_by_connection: dict[int, PrivateMessage] = {}
        if message_ids:
            latest_messages = (
                db.query(PrivateMessage)
                .options(joinedload(PrivateMessage.sender))
                .filter(PrivateMessage.id.in_(message_ids))
                .all()
            )
            latest_by_connection = {
                message.connection_id: message for message in latest_messages
            }

        summaries = [
            {
                "connection": connection,
                "last_message": latest_by_connection.get(connection.id),
            }
            for connection in connections
        ]
        return sorted(
            summaries,
            key=lambda summary: (
                summary["last_message"].created_at
                if summary["last_message"] is not None
                else summary["connection"].responded_at
                or summary["connection"].created_at
            ),
            reverse=True,
        )

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
