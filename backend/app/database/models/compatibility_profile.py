import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class CompatibilityProfile(Base):
    __tablename__ = "compatibility_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    cleanliness: Mapped[str] = mapped_column(String, nullable=False)
    dishes: Mapped[str] = mapped_column(String, nullable=False)
    common_objects: Mapped[str] = mapped_column(String, nullable=False)
    noise: Mapped[str] = mapped_column(String, nullable=False)
    visits: Mapped[str] = mapped_column(String, nullable=False)
    sleepovers: Mapped[str] = mapped_column(String, nullable=False)
    wake_up: Mapped[str] = mapped_column(String, nullable=False)
    night_noise: Mapped[str] = mapped_column(String, nullable=False)
    smoking: Mapped[str] = mapped_column(String, nullable=False)
    alcohol: Mapped[str] = mapped_column(String, nullable=False)
    pets: Mapped[str] = mapped_column(String, nullable=False)
    bills: Mapped[str] = mapped_column(String, nullable=False)
    food: Mapped[str] = mapped_column(String, nullable=False)
    communication: Mapped[str] = mapped_column(String, nullable=False)
    conflicts: Mapped[str] = mapped_column(String, nullable=False)
    rules: Mapped[str] = mapped_column(String, nullable=False)
    culture: Mapped[str] = mapped_column(String, nullable=False)
    space: Mapped[str] = mapped_column(String, nullable=False)
    lifestyle: Mapped[str] = mapped_column(String, nullable=False)

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

    user: Mapped["User"] = relationship(
        "User",
        back_populates="compatibility_profile"
    )
