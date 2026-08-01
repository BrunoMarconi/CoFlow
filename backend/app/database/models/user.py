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
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False
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

    community_messages: Mapped[list["CommunityMessage"]] = relationship(
        "CommunityMessage",
        back_populates="sender",
    )

