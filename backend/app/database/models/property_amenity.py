from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class PropertyAmenity(Base):
    __tablename__ = "property_amenities"

    property_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("properties.id", ondelete="CASCADE"),
        primary_key=True,
    )
    amenity_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("amenities.id", ondelete="CASCADE"),
        primary_key=True,
    )

    property: Mapped["Property"] = relationship(
        "Property",
        back_populates="amenity_links",
    )
    amenity: Mapped["Amenity"] = relationship(
        "Amenity",
        back_populates="property_links",
    )
