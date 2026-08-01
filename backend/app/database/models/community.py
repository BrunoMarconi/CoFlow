import enum
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class CommunityJoinType(str, enum.Enum):
    OPEN = "OPEN"
    REQUEST = "REQUEST"


class CommunityUrgency(str, enum.Enum):
    NORMAL = "NORMAL"
    SOON = "SOON"
    URGENT = "URGENT"


class CommunityProfileType(str, enum.Enum):
    STUDENTS = "STUDENTS"
    YOUNG_PROFESSIONALS = "YOUNG_PROFESSIONALS"
    DIGITAL_NOMADS = "DIGITAL_NOMADS"
    WORKERS = "WORKERS"
    EXAM_CANDIDATES = "EXAM_CANDIDATES"
    INTERNATIONAL_STUDENTS = "INTERNATIONAL_STUDENTS"
    MIXED = "MIXED"
    OTHER = "OTHER"


class Community(Base):
    __tablename__ = "communities"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    name: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    city: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    province: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    neighborhood: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )

    max_members: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    join_type: Mapped[CommunityJoinType] = mapped_column(
        Enum(
            CommunityJoinType,
            name="community_join_type",
        ),
        nullable=False,
        default=CommunityJoinType.REQUEST,
    )

    open_spots: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    urgency: Mapped[CommunityUrgency] = mapped_column(
        Enum(
            CommunityUrgency,
            name="community_urgency",
        ),
        nullable=False,
        default=CommunityUrgency.NORMAL,
    )

    profile_type: Mapped[CommunityProfileType] = mapped_column(
        Enum(
            CommunityProfileType,
            name="community_profile_type",
        ),
        nullable=False,
        default=CommunityProfileType.MIXED,
        server_default=CommunityProfileType.MIXED.value,
    )

    profile_description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    monthly_rent: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    total_monthly_rent: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    deposit: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    move_in_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    room_description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    owner: Mapped["User"] = relationship(
        "User",
        back_populates="owned_communities",
    )

    preferences: Mapped["CommunityPreferences | None"] = relationship(
        "CommunityPreferences",
        back_populates="community",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    members: Mapped[list["CommunityMember"]] = relationship(
        "CommunityMember",
        back_populates="community",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    messages: Mapped[list["CommunityMessage"]] = relationship(
        "CommunityMessage",
        back_populates="community",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    invitations: Mapped[list["CommunityInvitation"]] = relationship(
        "CommunityInvitation",
        back_populates="community",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    applications: Mapped[list["CommunityApplication"]] = relationship(
        "CommunityApplication",
        back_populates="community",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )