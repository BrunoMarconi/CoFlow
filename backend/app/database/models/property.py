import enum
from datetime import date, datetime, timezone

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class PropertyType(str, enum.Enum):
    APARTMENT = "APARTMENT"
    HOUSE = "HOUSE"
    STUDIO = "STUDIO"
    SHARED_APARTMENT = "SHARED_APARTMENT"
    OTHER = "OTHER"


class PropertyStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    READY = "READY"
    PAUSED = "PAUSED"
    PUBLISHED = "PUBLISHED"
    RENTED = "RENTED"
    ARCHIVED = "ARCHIVED"


class PropertySubscriptionStatus(str, enum.Enum):
    NONE = "NONE"
    TRIALING = "TRIALING"
    ACTIVE = "ACTIVE"
    PAST_DUE = "PAST_DUE"
    CANCELED = "CANCELED"


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    owner_profile_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("owner_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    property_type: Mapped[PropertyType] = mapped_column(
        Enum(PropertyType, name="property_type"),
        nullable=False,
    )

    status: Mapped[PropertyStatus] = mapped_column(
        Enum(PropertyStatus, name="property_status"),
        nullable=False,
        default=PropertyStatus.DRAFT,
    )

    address_line: Mapped[str] = mapped_column(String(200), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    province: Mapped[str] = mapped_column(String(100), nullable=False)
    postal_code: Mapped[str] = mapped_column(String(15), nullable=False)
    neighborhood: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )

    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    surface_m2: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bedrooms: Mapped[int] = mapped_column(Integer, nullable=False)
    bathrooms: Mapped[int] = mapped_column(Integer, nullable=False)
    floor: Mapped[str | None] = mapped_column(String(20), nullable=True)
    has_elevator: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    furnished: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    max_tenants: Mapped[int] = mapped_column(Integer, nullable=False)

    total_monthly_rent: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    deposit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    utilities_included: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    available_from: Mapped[date | None] = mapped_column(Date, nullable=True)
    minimum_stay_months: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    pets_allowed: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
    )
    smoking_allowed: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
    )
    couples_allowed: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
    )
    students_allowed: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
    )
    registration_allowed: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
    )
    additional_requirements: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Suscripción de Stripe de este piso (23,99€/mes, 30 días de prueba
    # desde que el piso pasa a READY por primera vez). Ver
    # app/services/billing_service.py. subscription_status se mantiene
    # sincronizado desde los webhooks de Stripe, no se infiere en local.
    stripe_subscription_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    subscription_status: Mapped[PropertySubscriptionStatus] = mapped_column(
        Enum(PropertySubscriptionStatus, name="property_subscription_status"),
        nullable=False,
        default=PropertySubscriptionStatus.NONE,
    )
    trial_ends_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    ready_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    rented_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    archived_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
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

    owner_profile: Mapped["OwnerProfile"] = relationship(
        "OwnerProfile",
        back_populates="properties",
    )

    images: Mapped[list["PropertyImage"]] = relationship(
        "PropertyImage",
        back_populates="property",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="PropertyImage.position",
    )

    amenity_links: Mapped[list["PropertyAmenity"]] = relationship(
        "PropertyAmenity",
        back_populates="property",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
