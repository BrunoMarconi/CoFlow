import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class CommunityMemberRole(str, enum.Enum):
    OWNER = "OWNER"
    MEMBER = "MEMBER"


class CommunityMember(Base):
    __tablename__ = "community_members"

    __table_args__ = (
        UniqueConstraint(
            "community_id",
            "user_id",
            name="uq_community_members_community_user",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    community_id: Mapped[int] = mapped_column(
        ForeignKey(
            "communities.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    role: Mapped[CommunityMemberRole] = mapped_column(
        Enum(
            CommunityMemberRole,
            name="community_member_role",
        ),
        nullable=False,
        default=CommunityMemberRole.MEMBER,
    )

    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    monthly_contribution: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    community: Mapped["Community"] = relationship(
        "Community",
        back_populates="members",
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="community_memberships",
    )