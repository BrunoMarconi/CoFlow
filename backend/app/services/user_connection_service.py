from uuid import UUID
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.database.models.notification import NotificationType
from app.database.models.user import User
from app.database.models.user_connection import (
    UserConnection,
    UserConnectionStatus,
)
from app.services.notification_service import create_notification
from app.services.user_safety_service import UserSafetyService


user_safety_service = UserSafetyService()


class UserConnectionService:

    def _load_options(self):
        return (
            joinedload(UserConnection.requester),
            joinedload(UserConnection.recipient),
        )

    def _get_existing_between(
        self,
        db: Session,
        user_a: UUID,
        user_b: UUID,
    ) -> UserConnection | None:
        return (
            db.query(UserConnection)
            .filter(
                or_(
                    (UserConnection.requester_id == user_a)
                    & (UserConnection.recipient_id == user_b),
                    (UserConnection.requester_id == user_b)
                    & (UserConnection.recipient_id == user_a),
                ),
                UserConnection.status.in_(
                    [
                        UserConnectionStatus.PENDING,
                        UserConnectionStatus.ACCEPTED,
                    ]
                ),
            )
            .first()
        )

    def create_connection_request(
        self,
        db: Session,
        current_user: User,
        recipient_id: UUID,
    ) -> UserConnection:
        if recipient_id == current_user.id:
            raise HTTPException(
                status_code=409,
                detail="You cannot connect with yourself",
            )

        # Bloqueamos siempre las dos filas en el mismo orden. Así dos
        # peticiones simultáneas y cruzadas (A→B y B→A) no pueden crear dos
        # conexiones activas antes de que ninguna vea a la otra.
        participant_ids = sorted(
            (current_user.id, recipient_id),
            key=str,
        )
        participants = (
            db.query(User)
            .filter(User.id.in_(participant_ids))
            .order_by(User.id)
            .with_for_update()
            .all()
        )
        recipient = next(
            (user for user in participants if user.id == recipient_id),
            None,
        )

        if recipient is None:
            raise HTTPException(
                status_code=404,
                detail="User not found",
            )

        user_safety_service.ensure_not_blocked_between(
            db,
            current_user.id,
            recipient_id,
        )

        if not recipient.is_looking_for_roommates:
            raise HTTPException(
                status_code=409,
                detail="This person is not looking for roommates "
                "right now",
            )

        existing = self._get_existing_between(
            db, current_user.id, recipient_id
        )

        if existing is not None:
            if existing.status == UserConnectionStatus.ACCEPTED:
                raise HTTPException(
                    status_code=409,
                    detail="You are already connected with this person",
                )

            raise HTTPException(
                status_code=409,
                detail="There is already a pending connection "
                "request between you",
            )

        connection = UserConnection(
            requester_id=current_user.id,
            recipient_id=recipient_id,
        )

        try:
            db.add(connection)

            create_notification(
                db=db,
                user_id=recipient_id,
                type=NotificationType.CONNECTION_REQUEST_RECEIVED,
                title="Nueva solicitud de conexión",
                message=(
                    f"{current_user.first_name} {current_user.last_name} "
                    "quiere conectar contigo."
                ),
                link="/conexiones?tab=recibidas",
            )

            db.commit()
            db.refresh(connection)

        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=409,
                detail="There is already a connection between you",
            )

        except Exception:
            db.rollback()
            raise

        return (
            db.query(UserConnection)
            .options(*self._load_options())
            .filter(UserConnection.id == connection.id)
            .first()
        )

    def list_connections(
        self,
        db: Session,
        current_user: User,
    ) -> list[UserConnection]:
        return (
            db.query(UserConnection)
            .options(*self._load_options())
            .filter(
                or_(
                    UserConnection.requester_id == current_user.id,
                    UserConnection.recipient_id == current_user.id,
                ),
                UserConnection.status == UserConnectionStatus.ACCEPTED,
            )
            .order_by(UserConnection.responded_at.desc())
            .all()
        )

    def list_received_requests(
        self,
        db: Session,
        current_user: User,
    ) -> list[UserConnection]:
        return (
            db.query(UserConnection)
            .options(*self._load_options())
            .filter(
                UserConnection.recipient_id == current_user.id,
                UserConnection.status == UserConnectionStatus.PENDING,
            )
            .order_by(UserConnection.created_at.desc())
            .all()
        )

    def list_sent_requests(
        self,
        db: Session,
        current_user: User,
    ) -> list[UserConnection]:
        return (
            db.query(UserConnection)
            .options(*self._load_options())
            .filter(
                UserConnection.requester_id == current_user.id,
                UserConnection.status == UserConnectionStatus.PENDING,
            )
            .order_by(UserConnection.created_at.desc())
            .all()
        )

    def get_overview(
        self,
        db: Session,
        current_user: User,
    ) -> dict[str, list[UserConnection]]:
        """Devuelve el estado completo de Conexiones en una sola lectura.

        El frontend no tiene que coordinar tres peticiones que podrían llegar
        en momentos distintos después de aceptar o cancelar una solicitud.
        """

        return {
            "accepted": self.list_connections(db, current_user),
            "received": self.list_received_requests(db, current_user),
            "sent": self.list_sent_requests(db, current_user),
        }

    def _get_connection(
        self,
        db: Session,
        connection_id: int,
    ) -> UserConnection:
        connection = (
            db.query(UserConnection)
            .options(*self._load_options())
            .filter(UserConnection.id == connection_id)
            .first()
        )

        if connection is None:
            raise HTTPException(
                status_code=404,
                detail="Connection not found",
            )

        return connection

    def accept_connection(
        self,
        db: Session,
        current_user: User,
        connection_id: int,
    ) -> UserConnection:
        connection = self._get_connection(db, connection_id)

        if connection.recipient_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Only the recipient can accept this request",
            )

        if connection.status != UserConnectionStatus.PENDING:
            raise HTTPException(
                status_code=409,
                detail="This connection request is no longer pending",
            )

        connection.status = UserConnectionStatus.ACCEPTED
        connection.responded_at = datetime.now(timezone.utc)

        create_notification(
            db=db,
            user_id=connection.requester_id,
            type=NotificationType.CONNECTION_REQUEST_ACCEPTED,
            title="Conexión aceptada",
            message=(
                f"{current_user.first_name} {current_user.last_name} "
                "ha aceptado tu solicitud de conexión."
            ),
            link=f"/mensajes/{connection.id}",
        )

        db.commit()
        db.refresh(connection)

        return connection

    def reject_connection(
        self,
        db: Session,
        current_user: User,
        connection_id: int,
    ) -> UserConnection:
        connection = self._get_connection(db, connection_id)

        if connection.recipient_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Only the recipient can reject this request",
            )

        if connection.status != UserConnectionStatus.PENDING:
            raise HTTPException(
                status_code=409,
                detail="This connection request is no longer pending",
            )

        connection.status = UserConnectionStatus.REJECTED
        connection.responded_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(connection)

        return connection

    def cancel_connection(
        self,
        db: Session,
        current_user: User,
        connection_id: int,
    ) -> UserConnection:
        connection = self._get_connection(db, connection_id)

        if connection.requester_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Only the requester can cancel this request",
            )

        if connection.status != UserConnectionStatus.PENDING:
            raise HTTPException(
                status_code=409,
                detail="This connection request is no longer pending",
            )

        connection.status = UserConnectionStatus.CANCELLED
        connection.cancelled_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(connection)

        return connection

    def delete_connection(
        self,
        db: Session,
        current_user: User,
        connection_id: int,
    ) -> None:
        connection = self._get_connection(db, connection_id)

        if current_user.id not in (
            connection.requester_id,
            connection.recipient_id,
        ):
            raise HTTPException(
                status_code=403,
                detail="You are not part of this connection",
            )

        if connection.status != UserConnectionStatus.ACCEPTED:
            raise HTTPException(
                status_code=409,
                detail="Only accepted connections can be removed",
            )

        connection.status = UserConnectionStatus.CANCELLED
        connection.cancelled_at = datetime.now(timezone.utc)

        db.commit()

    def ensure_participant(
        self,
        db: Session,
        current_user: User,
        connection_id: int,
    ) -> UserConnection:
        """
        Verifica que el usuario actual pertenece a la conexión y
        que sigue ACCEPTED, requisito para leer o escribir en el
        chat privado.
        """

        connection = self._get_connection(db, connection_id)

        if current_user.id not in (
            connection.requester_id,
            connection.recipient_id,
        ):
            raise HTTPException(
                status_code=403,
                detail="You are not part of this connection",
            )

        other_user_id = (
            connection.recipient_id
            if connection.requester_id == current_user.id
            else connection.requester_id
        )
        user_safety_service.ensure_not_blocked_between(
            db,
            current_user.id,
            other_user_id,
        )

        if connection.status != UserConnectionStatus.ACCEPTED:
            raise HTTPException(
                status_code=403,
                detail="This connection is not active",
            )

        return connection
