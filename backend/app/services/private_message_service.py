from fastapi import HTTPException, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.config import MAX_IMAGE_SIZE_BYTES
from app.database.models.notification import NotificationType
from app.database.models.private_message import PrivateMessage
from app.database.models.private_message_read import PrivateMessageRead
from app.database.models.user import User
from app.schemas.private_message import PrivateMessageCreate
from app.services import storage_service
from app.services import typing_indicator_service
from app.services.notification_service import create_notification
from app.services.user_connection_service import UserConnectionService

MAX_LIMIT = 100
CHAT_IMAGE_SUBFOLDER = "chat"

user_connection_service = UserConnectionService()


class PrivateMessageService:

    def _load_options(self):
        return (
            joinedload(PrivateMessage.sender),
            joinedload(PrivateMessage.reply_to).joinedload(
                PrivateMessage.sender
            ),
        )

    def _to_response(self, message: PrivateMessage, current_user_id) -> dict:
        reply_to = None
        if message.reply_to is not None and not message.reply_to.is_deleted:
            reply_to = {
                "id": message.reply_to.id,
                "content": message.reply_to.content,
                "sender_id": message.reply_to.sender_id,
                "sender_first_name": message.reply_to.sender.first_name,
            }

        liked_by = message.liked_by_user_ids or []
        return {
            "id": message.id,
            "connection_id": message.connection_id,
            "content": message.content,
            "image_url": message.image_url,
            "created_at": message.created_at,
            "updated_at": message.updated_at,
            "sender": message.sender,
            "reply_to": reply_to,
            "like_count": len(liked_by),
            "liked_by_me": str(current_user_id) in liked_by,
        }

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
                .options(*self._load_options())
                .filter(PrivateMessage.id.in_(message_ids))
                .all()
            )
            latest_by_connection = {
                message.connection_id: message for message in latest_messages
            }

        summaries = [
            {
                "connection": connection,
                "last_message": (
                    self._to_response(
                        latest_by_connection[connection.id], current_user.id
                    )
                    if connection.id in latest_by_connection
                    else None
                ),
            }
            for connection in connections
        ]
        return sorted(
            summaries,
            key=lambda summary: (
                summary["last_message"]["created_at"]
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
    ) -> list[dict]:
        user_connection_service.ensure_participant(
            db, current_user, connection_id
        )

        limit = min(max(limit, 1), MAX_LIMIT)
        skip = max(skip, 0)

        messages = (
            db.query(PrivateMessage)
            .options(*self._load_options())
            .filter(
                PrivateMessage.connection_id == connection_id,
                PrivateMessage.is_deleted.is_(False),
            )
            .order_by(PrivateMessage.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        return [
            self._to_response(message, current_user.id)
            for message in reversed(messages)
        ]

    def create_message(
        self,
        db: Session,
        current_user: User,
        connection_id: int,
        data: PrivateMessageCreate,
    ) -> dict:
        connection = user_connection_service.ensure_participant(
            db, current_user, connection_id
        )

        recipient_id = (
            connection.recipient_id
            if connection.requester_id == current_user.id
            else connection.requester_id
        )

        if data.reply_to_id is not None:
            replied = (
                db.query(PrivateMessage)
                .filter(
                    PrivateMessage.id == data.reply_to_id,
                    PrivateMessage.connection_id == connection_id,
                )
                .first()
            )
            if replied is None:
                raise HTTPException(
                    status_code=404,
                    detail="Message being replied to was not found",
                )

        message = PrivateMessage(
            connection_id=connection_id,
            sender_id=current_user.id,
            content=data.content,
            reply_to_id=data.reply_to_id,
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

        loaded = (
            db.query(PrivateMessage)
            .options(*self._load_options())
            .filter(PrivateMessage.id == message.id)
            .first()
        )

        return self._to_response(loaded, current_user.id)

    async def create_image_message(
        self,
        db: Session,
        current_user: User,
        connection_id: int,
        file: UploadFile,
        content: str,
    ):
        connection = user_connection_service.ensure_participant(
            db, current_user, connection_id
        )
        recipient_id = (
            connection.recipient_id
            if connection.requester_id == current_user.id
            else connection.requester_id
        )

        raw = await file.read()
        validated = storage_service.validate_image(raw, MAX_IMAGE_SIZE_BYTES)
        storage_key, url = storage_service.upload_file(validated, CHAT_IMAGE_SUBFOLDER)

        message = PrivateMessage(
            connection_id=connection_id,
            sender_id=current_user.id,
            content=content.strip(),
            image_url=url,
        )

        try:
            db.add(message)
            create_notification(
                db=db,
                user_id=recipient_id,
                type=NotificationType.PRIVATE_MESSAGE_RECEIVED,
                title="Nuevo mensaje privado",
                message=f"{current_user.first_name} te ha enviado una foto.",
                link=f"/mensajes/{connection_id}",
            )
            db.commit()
            db.refresh(message)
        except Exception:
            db.rollback()
            storage_service.delete_file(storage_key, CHAT_IMAGE_SUBFOLDER)
            raise

        loaded = (
            db.query(PrivateMessage)
            .options(*self._load_options())
            .filter(PrivateMessage.id == message.id)
            .first()
        )
        return self._to_response(loaded, current_user.id)

    def mark_read(
        self,
        db: Session,
        current_user: User,
        connection_id: int,
        last_read_message_id: int,
    ) -> None:
        user_connection_service.ensure_participant(db, current_user, connection_id)

        record = (
            db.query(PrivateMessageRead)
            .filter(
                PrivateMessageRead.connection_id == connection_id,
                PrivateMessageRead.user_id == current_user.id,
            )
            .first()
        )

        if record is None:
            record = PrivateMessageRead(
                connection_id=connection_id,
                user_id=current_user.id,
                last_read_message_id=last_read_message_id,
            )
            db.add(record)
        elif last_read_message_id > record.last_read_message_id:
            record.last_read_message_id = last_read_message_id
        else:
            return

        try:
            db.commit()
        except Exception:
            db.rollback()
            raise

    def get_read_receipt(
        self,
        db: Session,
        current_user: User,
        connection_id: int,
    ) -> int | None:
        connection = user_connection_service.ensure_participant(
            db, current_user, connection_id
        )
        other_user_id = (
            connection.recipient_id
            if connection.requester_id == current_user.id
            else connection.requester_id
        )

        record = (
            db.query(PrivateMessageRead)
            .filter(
                PrivateMessageRead.connection_id == connection_id,
                PrivateMessageRead.user_id == other_user_id,
            )
            .first()
        )
        return record.last_read_message_id if record else None

    def mark_typing(self, db: Session, current_user: User, connection_id: int) -> None:
        user_connection_service.ensure_participant(db, current_user, connection_id)
        typing_indicator_service.mark_typing(
            f"private:{connection_id}", str(current_user.id), current_user.first_name
        )

    def get_typing_names(
        self, db: Session, current_user: User, connection_id: int
    ) -> list[str]:
        user_connection_service.ensure_participant(db, current_user, connection_id)
        return typing_indicator_service.get_typing_users(
            f"private:{connection_id}", str(current_user.id)
        )

    def delete_message(
        self,
        db: Session,
        current_user: User,
        connection_id: int,
        message_id: int,
    ) -> None:
        """Borrado lógico — solo quien escribió el mensaje puede
        borrarlo (a diferencia del chat de comunidad, aquí no hay
        ningún "administrador" con permisos de moderación)."""
        user_connection_service.ensure_participant(
            db, current_user, connection_id
        )

        message = (
            db.query(PrivateMessage)
            .filter(
                PrivateMessage.id == message_id,
                PrivateMessage.connection_id == connection_id,
                PrivateMessage.is_deleted.is_(False),
            )
            .first()
        )

        if message is None:
            raise HTTPException(status_code=404, detail="Message not found")

        if message.sender_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only delete your own messages",
            )

        message.is_deleted = True

        try:
            db.commit()
        except Exception:
            db.rollback()
            raise

    def toggle_like(
        self,
        db: Session,
        current_user: User,
        connection_id: int,
        message_id: int,
    ) -> dict:
        user_connection_service.ensure_participant(
            db, current_user, connection_id
        )

        message = (
            db.query(PrivateMessage)
            .options(*self._load_options())
            .filter(
                PrivateMessage.id == message_id,
                PrivateMessage.connection_id == connection_id,
                PrivateMessage.is_deleted.is_(False),
            )
            .first()
        )

        if message is None:
            raise HTTPException(status_code=404, detail="Message not found")

        liked_by = list(message.liked_by_user_ids or [])
        user_id_str = str(current_user.id)

        if user_id_str in liked_by:
            liked_by.remove(user_id_str)
        else:
            liked_by.append(user_id_str)

        message.liked_by_user_ids = liked_by

        try:
            db.commit()
            db.refresh(message)
        except Exception:
            db.rollback()
            raise

        return self._to_response(message, current_user.id)
