import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    last_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False
    )
    password_hash: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    phone: Mapped[str] = mapped_column(
        String(30),
        nullable=True
    )
    role: Mapped[str] = mapped_column(
        Enum("USER", "OWNER", "ADMIN", name="user_roles"),
        nullable=False,
        default="USER"
    )
    is_email_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False
    )
    email_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    onboarding_completed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False
    )
    rental_budget: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    is_looking_for_roommates: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True,
    )
    avatar_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    avatar_storage_key: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    age: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    occupation: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    bio: Mapped[str | None] = mapped_column(
        String(160),
        nullable=True,
    )
    # Se actualiza (con throttling) en get_current_user en cada
    # petición autenticada — ver app/core/dependencies.py. A partir de
    # aquí se calcula is_online en el perfil público (sin guardar un
    # booleano aparte que podría quedar desincronizado).
    last_active_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    compatibility_profile: Mapped["CompatibilityProfile | None"] = relationship(
        "CompatibilityProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    owner_profile: Mapped["OwnerProfile | None"] = relationship(
        "OwnerProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    owned_communities: Mapped[list["Community"]] = relationship(
        "Community",
        back_populates="owner"
    )

    community_memberships: Mapped[list["CommunityMember"]] = relationship(
    "CommunityMember",
    back_populates="user",
    cascade="all, delete-orphan",
    passive_deletes=True,
)

    photos: Mapped[list["UserPhoto"]] = relationship(
        "UserPhoto",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="UserPhoto.position",
    )

    community_messages: Mapped[list["CommunityMessage"]] = relationship(
        "CommunityMessage",
        back_populates="sender",
    )

