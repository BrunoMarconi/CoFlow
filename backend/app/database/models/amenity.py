from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Amenity(Base):
    __tablename__ = "amenities"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    key: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
    )
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    property_links: Mapped[list["PropertyAmenity"]] = relationship(
        "PropertyAmenity",
        back_populates="amenity",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
