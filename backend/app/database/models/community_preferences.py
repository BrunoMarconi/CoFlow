from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.database.models.community import Community
from app.database.models.community import Community


class CommunityPreferences(Base):
    __tablename__ = "community_preferences"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    community_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("communities.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    cleanliness: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    atmosphere: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    visits: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    sleepovers: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    smoking: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    pets: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    rules: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    lifestyle: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
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

    community: Mapped["Community"] = relationship(
        "Community",
        back_populates="preferences",
    )