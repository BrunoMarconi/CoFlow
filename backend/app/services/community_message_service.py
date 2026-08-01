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
            .options(joinedload(CommunityMessage.sender))
            .filter(
                CommunityMessage.community_id == community_id,
                CommunityMessage.is_deleted.is_(False),
            )
            .order_by(CommunityMessage.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        return list(reversed(messages))

    def create_message(
        self,
        db: Session,
        community_id: int,
        current_user: User,
        data: CommunityMessageCreate,
    ):
        self._ensure_active_membership(db, community_id, current_user)

        message = CommunityMessage(
            community_id=community_id,
            sender_id=current_user.id,
            content=data.content,
        )

        try:
            db.add(message)
            db.commit()
            db.refresh(message)

        except Exception:
            db.rollback()
            raise

        return (
            db.query(CommunityMessage)
            .options(joinedload(CommunityMessage.sender))
            .filter(CommunityMessage.id == message.id)
            .first()
        )
