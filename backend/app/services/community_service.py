from uuid import UUID

from fastapi import HTTPException, UploadFile
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.config import MAX_IMAGE_SIZE_BYTES
from app.database.models.community import (
    Community,
    CommunityJoinType,
    CommunityProfileType,
)
from app.database.models.community_member import (
    CommunityMember,
    CommunityMemberRole,
)
from app.database.models.community_preferences import CommunityPreferences
from app.database.models.compatibility_profile import CompatibilityProfile
from app.database.models.notification import NotificationType
from app.database.models.user import User
from app.schemas.community import CommunityCreate, CommunityUpdate
from app.schemas.compatibility_score import CompatibilityScoreResponse
from app.services import storage_service
from app.services.compatibility_score_service import (
    average_category_scores,
    compute_category_scores,
)
from app.services.notification_service import create_notification

MAX_LIMIT = 100
COVER_IMAGE_SUBFOLDER = "communities"


class CommunityService:

    def _community_load_options(self):
        return (
            selectinload(Community.preferences),
            selectinload(Community.members).selectinload(
                CommunityMember.user
            ),
        )

    def _enrich_community(
        self,
        db: Session,
        community: Community,
        current_user: User,
    ):
        """
        Añade información calculada para el usuario actual.

        Estos atributos no se guardan en la base de datos.
        Pydantic los utilizará al construir CommunityResponse.
        """

        member_count = (
            db.query(func.count(CommunityMember.id))
            .filter(
                CommunityMember.community_id == community.id,
            )
            .scalar()
            or 0
        )

        current_membership = (
            db.query(CommunityMember)
            .filter(
                CommunityMember.community_id == community.id,
                CommunityMember.user_id == current_user.id,
            )
            .first()
        )

        community.member_count = member_count
        community.is_member = current_membership is not None
        community.current_user_role = (
            current_membership.role
            if current_membership is not None
            else None
        )
        community.is_full = (
            member_count >= community.max_members
        )

        community.members = sorted(
            community.members,
            key=lambda membership: (
                membership.role != CommunityMemberRole.OWNER,
                membership.joined_at,
            ),
        )

        member_ids = [membership.user_id for membership in community.members]
        member_profiles = (
            db.query(CompatibilityProfile)
            .filter(CompatibilityProfile.user_id.in_(member_ids))
            .all()
            if member_ids
            else []
        )
        community.average_compatibility = (
            CompatibilityScoreResponse(
                categories=average_category_scores(
                    [compute_category_scores(profile) for profile in member_profiles]
                )
            )
            if member_profiles
            else None
        )

        return community

    def create_community(
        self,
        db: Session,
        current_user: User,
        data: CommunityCreate,
    ):
        existing_community = (
            db.query(Community)
            .filter(
                Community.owner_id == current_user.id,
                Community.is_active.is_(True),
            )
            .first()
        )

        if existing_community is not None:
            raise HTTPException(
                status_code=409,
                detail="You already have an active community",
            )

        existing_active_membership = (
            db.query(CommunityMember)
            .join(
                Community,
                Community.id == CommunityMember.community_id,
            )
            .filter(
                CommunityMember.user_id == current_user.id,
                Community.is_active.is_(True),
            )
            .first()
        )

        if existing_active_membership is not None:
            raise HTTPException(
                status_code=409,
                detail="You already belong to another active community",
            )

        maximum_open_spots = data.max_members - 1

        if data.open_spots > maximum_open_spots:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Open spots cannot exceed the available "
                    "capacity after adding the owner"
                ),
            )

        community = Community(
            name=data.name,
            description=data.description,
            city=data.city,
            province=data.province,
            neighborhood=data.neighborhood,
            max_members=data.max_members,
            owner_id=current_user.id,
            join_type=data.join_type,
            open_spots=data.open_spots,
            urgency=data.urgency,
            profile_type=data.profile_type,
            profile_description=data.profile_description,
            monthly_rent=data.monthly_rent,
            deposit=data.deposit,
            move_in_date=data.move_in_date,
            room_description=data.room_description,
            cover_color=data.cover_color,
        )

        community.preferences = CommunityPreferences(
            cleanliness=data.preferences.cleanliness,
            atmosphere=data.preferences.atmosphere,
            visits=data.preferences.visits,
            sleepovers=data.preferences.sleepovers,
            smoking=data.preferences.smoking,
            pets=data.preferences.pets,
            rules=data.preferences.rules,
            lifestyle=data.preferences.lifestyle,
        )

        community.members.append(
            CommunityMember(
                user_id=current_user.id,
                role=CommunityMemberRole.OWNER,
            )
        )

        try:
            db.add(community)
            db.commit()
            db.refresh(community)

        except IntegrityError:
            db.rollback()

            raise HTTPException(
                status_code=409,
                detail=(
                    "You already have or belong to "
                    "an active community"
                ),
            )

        except Exception:
            db.rollback()
            raise

        return self.get_community_by_id(
            db=db,
            community_id=community.id,
            current_user=current_user,
        )

    def leave_community(
        self,
        db: Session,
        current_user: User,
        community_id: int,
    ):
        """
        Permite que un miembro (no propietario) abandone su
        comunidad activa. Elimina su CommunityMember, pero no
        modifica open_spots: liberar capacidad no significa que
        la comunidad quiera buscar un sustituto automáticamente.
        """

        community = self.get_community_by_id(
            db=db,
            community_id=community_id,
            current_user=current_user,
        )

        if community.owner_id == current_user.id:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Owner must transfer ownership or close "
                    "the community before leaving"
                ),
            )

        membership = (
            db.query(CommunityMember)
            .filter(
                CommunityMember.community_id == community_id,
                CommunityMember.user_id == current_user.id,
            )
            .first()
        )

        if membership is None:
            raise HTTPException(
                status_code=403,
                detail="You are not a member of this community",
            )

        try:
            db.delete(membership)

            create_notification(
                db=db,
                user_id=community.owner_id,
                type=NotificationType.COMMUNITY_MEMBER_LEFT,
                title="Un miembro ha abandonado la comunidad",
                message=(
                    f"{current_user.first_name} {current_user.last_name} "
                    f"ha abandonado {community.name}."
                ),
                link="/mi-comunidad",
            )

            db.commit()

        except Exception:
            db.rollback()
            raise

        return self.get_community_by_id(
            db=db,
            community_id=community_id,
            current_user=current_user,
        )

    def remove_member(
        self,
        db: Session,
        current_user: User,
        community_id: int,
        member_user_id: UUID,
    ):
        community = self.get_community_by_id(
            db=db,
            community_id=community_id,
            current_user=current_user,
        )
        if community.owner_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Only the owner can remove members",
            )
        if member_user_id == current_user.id:
            raise HTTPException(
                status_code=409,
                detail="The owner cannot remove themselves",
            )

        membership = (
            db.query(CommunityMember)
            .filter(
                CommunityMember.community_id == community_id,
                CommunityMember.user_id == member_user_id,
            )
            .first()
        )
        if membership is None:
            raise HTTPException(status_code=404, detail="Member not found")
        if membership.role == CommunityMemberRole.OWNER:
            raise HTTPException(
                status_code=409,
                detail="Ownership must be transferred before removing the owner",
            )

        try:
            db.delete(membership)
            create_notification(
                db=db,
                user_id=member_user_id,
                type=NotificationType.COMMUNITY_MEMBER_REMOVED,
                title="Ya no formas parte de la comunidad",
                message=(
                    f"La administración de {community.name} te ha retirado "
                    "de la comunidad."
                ),
                link="/comunidades",
            )
            db.commit()
        except Exception:
            db.rollback()
            raise

        return self.get_community_by_id(
            db=db,
            community_id=community_id,
            current_user=current_user,
        )

    def transfer_ownership(
        self,
        db: Session,
        current_user: User,
        community_id: int,
        new_owner_user_id: UUID,
    ):
        community = self.get_community_by_id(
            db=db,
            community_id=community_id,
            current_user=current_user,
        )
        if community.owner_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Only the owner can transfer ownership",
            )
        if new_owner_user_id == current_user.id:
            raise HTTPException(
                status_code=409,
                detail="This person is already the owner",
            )

        owner_membership = (
            db.query(CommunityMember)
            .filter(
                CommunityMember.community_id == community_id,
                CommunityMember.user_id == current_user.id,
            )
            .first()
        )
        new_owner_membership = (
            db.query(CommunityMember)
            .filter(
                CommunityMember.community_id == community_id,
                CommunityMember.user_id == new_owner_user_id,
            )
            .first()
        )
        if owner_membership is None or new_owner_membership is None:
            raise HTTPException(
                status_code=404,
                detail="The new owner must be an active community member",
            )

        try:
            owner_membership.role = CommunityMemberRole.MEMBER
            new_owner_membership.role = CommunityMemberRole.OWNER
            community.owner_id = new_owner_user_id
            create_notification(
                db=db,
                user_id=new_owner_user_id,
                type=NotificationType.COMMUNITY_OWNERSHIP_TRANSFERRED,
                title="Ahora administras la comunidad",
                message=f"Ya eres la persona administradora de {community.name}.",
                link="/mi-comunidad",
            )
            db.commit()
        except Exception:
            db.rollback()
            raise

        return self.get_community_by_id(
            db=db,
            community_id=community_id,
            current_user=current_user,
        )

    def get_communities(
        self,
        db: Session,
        current_user: User,
        city: str | None = None,
        province: str | None = None,
        profile_type: CommunityProfileType | None = None,
        skip: int = 0,
        limit: int = 20,
    ):
        limit = min(max(limit, 1), MAX_LIMIT)
        skip = max(skip, 0)

        query = (
            db.query(Community)
            .options(
                *self._community_load_options(),
            )
            .filter(
                Community.is_active.is_(True),
            )
        )

        if city:
            query = query.filter(
                Community.city.ilike(
                    f"%{city.strip()}%"
                )
            )

        if province:
            query = query.filter(
                Community.province.ilike(
                    f"%{province.strip()}%"
                )
            )

        if profile_type:
            query = query.filter(
                Community.profile_type == profile_type,
            )

        communities = (
            query
            .order_by(Community.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        return [
            self._enrich_community(
                db=db,
                community=community,
                current_user=current_user,
            )
            for community in communities
        ]

    def get_community_by_id(
        self,
        db: Session,
        community_id: int,
        current_user: User,
    ):
        community = (
            db.query(Community)
            .options(
                *self._community_load_options(),
            )
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

        return self._enrich_community(
            db=db,
            community=community,
            current_user=current_user,
        )

    def get_my_active_community(
        self,
        db: Session,
        current_user: User,
    ):
        """
        Devuelve la comunidad activa del usuario, ya sea como
        OWNER o como MEMBER. Un usuario solo puede pertenecer
        a una comunidad activa a la vez.
        """

        membership = (
            db.query(CommunityMember)
            .join(
                Community,
                Community.id == CommunityMember.community_id,
            )
            .filter(
                CommunityMember.user_id == current_user.id,
                Community.is_active.is_(True),
            )
            .first()
        )

        if membership is None:
            return None

        return self.get_community_by_id(
            db=db,
            community_id=membership.community_id,
            current_user=current_user,
        )

    async def upload_cover_image(
        self,
        db: Session,
        current_user: User,
        community_id: int,
        file: UploadFile,
    ):
        """Sustituye la portada automática (color + avatares) por una
        imagen personalizada. Sube primero, guarda en DB después: si
        falla la subida, la portada anterior (color o imagen) no se
        toca — mismo orden que user_photo_service.upload_avatar."""
        community = self.get_community_by_id(
            db=db,
            community_id=community_id,
            current_user=current_user,
        )

        if community.owner_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Only the owner can update this community",
            )

        content = await file.read()
        validated = storage_service.validate_image(
            content, MAX_IMAGE_SIZE_BYTES
        )
        storage_key, url = storage_service.upload_file(
            validated, COVER_IMAGE_SUBFOLDER
        )

        previous_storage_key = community.cover_storage_key

        try:
            community.cover_image_url = url
            community.cover_storage_key = storage_key
            db.commit()
        except Exception:
            db.rollback()
            storage_service.delete_file(storage_key, COVER_IMAGE_SUBFOLDER)
            raise

        if previous_storage_key:
            storage_service.delete_file(
                previous_storage_key, COVER_IMAGE_SUBFOLDER
            )

        return self.get_community_by_id(
            db=db,
            community_id=community_id,
            current_user=current_user,
        )

    def delete_cover_image(
        self,
        db: Session,
        current_user: User,
        community_id: int,
    ):
        """Quita la imagen personalizada: la portada vuelve a ser el
        color + avatares (cover_color se conserva tal cual)."""
        community = self.get_community_by_id(
            db=db,
            community_id=community_id,
            current_user=current_user,
        )

        if community.owner_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Only the owner can update this community",
            )

        storage_key = community.cover_storage_key

        try:
            community.cover_image_url = None
            community.cover_storage_key = None
            db.commit()
        except Exception:
            db.rollback()
            raise

        if storage_key:
            storage_service.delete_file(storage_key, COVER_IMAGE_SUBFOLDER)

        return self.get_community_by_id(
            db=db,
            community_id=community_id,
            current_user=current_user,
        )

    def update_community(
        self,
        db: Session,
        current_user: User,
        community_id: int,
        data: CommunityUpdate,
    ):
        community = self.get_community_by_id(
            db=db,
            community_id=community_id,
            current_user=current_user,
        )

        if community.owner_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Only the owner can update this community",
            )

        update_data = data.model_dump(
            exclude_unset=True,
            exclude={"preferences"},
        )

        new_max_members = update_data.get(
            "max_members",
            community.max_members,
        )

        current_member_count = (
            db.query(func.count(CommunityMember.id))
            .filter(
                CommunityMember.community_id == community.id,
            )
            .scalar()
            or 0
        )

        if new_max_members < current_member_count:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Maximum members cannot be lower "
                    "than the current member count"
                ),
            )

        new_open_spots = update_data.get(
            "open_spots",
            community.open_spots,
        )

        available_capacity = (
            new_max_members - current_member_count
        )

        if new_open_spots > available_capacity:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Open spots cannot exceed the currently "
                    "available community capacity"
                ),
            )

        for field, value in update_data.items():
            setattr(community, field, value)

        if data.preferences is not None:
            preference_data = (
                data.preferences.model_dump(
                    exclude_unset=True,
                )
            )

            if community.preferences is None:
                community.preferences = CommunityPreferences(
                    **preference_data
                )
            else:
                for field, value in preference_data.items():
                    setattr(
                        community.preferences,
                        field,
                        value,
                    )

        try:
            db.commit()

        except Exception:
            db.rollback()
            raise

        return self.get_community_by_id(
            db=db,
            community_id=community.id,
            current_user=current_user,
        )

    def delete_community(
        self,
        db: Session,
        current_user: User,
        community_id: int,
    ):
        community = self.get_community_by_id(
            db=db,
            community_id=community_id,
            current_user=current_user,
        )

        if community.owner_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Only the owner can delete this community",
            )

        community.is_active = False
        community.open_spots = 0

        try:
            db.commit()
            db.refresh(community)

        except Exception:
            db.rollback()
            raise

        return self._enrich_community(
            db=db,
            community=community,
            current_user=current_user,
        )

    def join_open_community(
        self,
        db: Session,
        current_user: User,
        community_id: int,
    ):
        community = self.get_community_by_id(
            db=db,
            community_id=community_id,
            current_user=current_user,
        )

        if community.owner_id == current_user.id:
            raise HTTPException(
                status_code=409,
                detail="You already own this community",
            )

        if community.join_type != CommunityJoinType.OPEN:
            raise HTTPException(
                status_code=409,
                detail="This community requires an application",
            )

        if community.open_spots <= 0:
            raise HTTPException(
                status_code=409,
                detail="This community is not currently looking for members",
            )

        existing_membership = (
            db.query(CommunityMember)
            .join(
                Community,
                Community.id == CommunityMember.community_id,
            )
            .filter(
                CommunityMember.user_id == current_user.id,
                Community.is_active.is_(True),
            )
            .first()
        )

        if existing_membership is not None:
            if existing_membership.community_id == community.id:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "You are already a member "
                        "of this community"
                    ),
                )

            raise HTTPException(
                status_code=409,
                detail=(
                    "You already belong to another "
                    "active community"
                ),
            )

        membership = CommunityMember(
            community_id=community.id,
            user_id=current_user.id,
            role=CommunityMemberRole.MEMBER,
        )

        try:
            # Bloqueamos la fila de la comunidad para que dos uniones
            # concurrentes no consuman la misma última plaza: la
            # comprobación de capacidad y la mutación ocurren juntas
            # bajo el mismo bloqueo de fila de PostgreSQL.
            locked_community = (
                db.query(Community)
                .filter(Community.id == community.id)
                .with_for_update()
                .one()
            )

            if locked_community.open_spots <= 0:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "This community is not currently "
                        "looking for members"
                    ),
                )

            member_count = (
                db.query(func.count(CommunityMember.id))
                .filter(
                    CommunityMember.community_id == locked_community.id,
                )
                .scalar()
                or 0
            )

            if member_count >= locked_community.max_members:
                raise HTTPException(
                    status_code=409,
                    detail="This community is full",
                )

            db.add(membership)

            locked_community.open_spots -= 1

            create_notification(
                db=db,
                user_id=community.owner_id,
                type=NotificationType.COMMUNITY_MEMBER_JOINED,
                title="Nuevo miembro en tu comunidad",
                message=(
                    f"{current_user.first_name} {current_user.last_name} "
                    f"se ha unido a {community.name}."
                ),
                link="/mi-comunidad",
            )

            db.commit()

        except IntegrityError:
            db.rollback()

            raise HTTPException(
                status_code=409,
                detail=(
                    "You are already a member "
                    "of this community"
                ),
            )

        except Exception:
            db.rollback()
            raise

        return self.get_community_by_id(
            db=db,
            community_id=community.id,
            current_user=current_user,
        )
