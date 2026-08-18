from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database.models.community import Community
from app.database.models.community_member import CommunityMember
from app.database.models.community_message import CommunityMessage
from app.database.models.user import User
from app.schemas.community_message import CommunityMessageCreate

MAX_LIMIT = 100


class CommunityMessageService:

    def _ensure_active_membership(
        self,
        db: Session,
        community_id: int,
        user: User,
    ):
        """
        Solo los miembros activos de una comunidad (OWNER o
        MEMBER) pueden leer o escribir en su chat. El propietario
        no tiene permisos especiales sobre otras comunidades.
        """

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
                detail="Only active members can access this community's chat",
            )

        return community

    def _to_response(self, message: CommunityMessage, current_user_id) -> dict:
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
            "community_id": message.community_id,
            "content": message.content,
            "created_at": message.created_at,
            "updated_at": message.updated_at,
            "sender": message.sender,
            "reply_to": reply_to,
            "like_count": len(liked_by),
            "liked_by_me": str(current_user_id) in liked_by,
        }

    def _load_options(self):
        return (
            joinedload(CommunityMessage.sender),
            joinedload(CommunityMessage.reply_to).joinedload(
                CommunityMessage.sender
            ),
        )

    def get_messages(
        self,
        db: Session,
        community_id: int,
        current_user: User,
        skip: int = 0,
        limit: int = 50,
    ):
        self._ensure_active_membership(db, community_id, current_user)

        limit = min(max(limit, 1), MAX_LIMIT)
        skip = max(skip, 0)

        # Los mensajes más recientes se anclan primero (skip cuenta
        # desde el más reciente) y luego se devuelven del más
        # antiguo al más reciente, como pide el chat.
        messages = (
            db.query(CommunityMessage)
            .options(*self._load_options())
            .filter(
                CommunityMessage.community_id == community_id,
                CommunityMessage.is_deleted.is_(False),
            )
            .order_by(CommunityMessage.created_at.desc())
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
        community_id: int,
        current_user: User,
        data: CommunityMessageCreate,
    ):
        self._ensure_active_membership(db, community_id, current_user)

        if data.reply_to_id is not None:
            replied = (
                db.query(CommunityMessage)
                .filter(
                    CommunityMessage.id == data.reply_to_id,
                    CommunityMessage.community_id == community_id,
                )
                .first()
            )
            if replied is None:
                raise HTTPException(
                    status_code=404,
                    detail="Message being replied to was not found",
                )

        message = CommunityMessage(
            community_id=community_id,
            sender_id=current_user.id,
            content=data.content,
            reply_to_id=data.reply_to_id,
        )

        try:
            db.add(message)
            db.commit()
            db.refresh(message)

        except Exception:
            db.rollback()
            raise

        loaded = (
            db.query(CommunityMessage)
            .options(*self._load_options())
            .filter(CommunityMessage.id == message.id)
            .first()
        )

        return self._to_response(loaded, current_user.id)

    def delete_message(
        self,
        db: Session,
        community_id: int,
        message_id: int,
        current_user: User,
    ) -> None:
        """Borrado lógico (is_deleted, no se borra la fila) — permitido
        para quien escribió el mensaje, o para el administrador de la
        comunidad como moderación de su propio chat (antes no existía
        ninguna forma de que el dueño moderase mensajes ajenos)."""
        community = self._ensure_active_membership(db, community_id, current_user)

        message = (
            db.query(CommunityMessage)
            .filter(
                CommunityMessage.id == message_id,
                CommunityMessage.community_id == community_id,
                CommunityMessage.is_deleted.is_(False),
            )
            .first()
        )

        if message is None:
            raise HTTPException(status_code=404, detail="Message not found")

        is_owner = community.owner_id == current_user.id
        if message.sender_id != current_user.id and not is_owner:
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
        community_id: int,
        message_id: int,
        current_user: User,
    ) -> dict:
        self._ensure_active_membership(db, community_id, current_user)

        message = (
            db.query(CommunityMessage)
            .options(*self._load_options())
            .filter(
                CommunityMessage.id == message_id,
                CommunityMessage.community_id == community_id,
                CommunityMessage.is_deleted.is_(False),
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
