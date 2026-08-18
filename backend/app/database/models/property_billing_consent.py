import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class PropertyBillingConsent(Base):
    """Evidencia legal de que el propietario aceptó, para ESTE piso en
    concreto, el precio, la periodicidad y la renovación automática
    antes de publicarlo con cobro. Una fila por cada vez que se acepta
    (ej. si el piso se archiva y se vuelve a suscribir más adelante, se
    guarda un nuevo consentimiento — nunca se sobrescribe el anterior)."""

    __tablename__ = "property_billing_consents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    property_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    terms_version: Mapped[str] = mapped_column(String(20), nullable=False)
    owner_terms_version: Mapped[str] = mapped_column(String(20), nullable=False)

    price_accepted: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="EUR")
    billing_interval: Mapped[str] = mapped_column(
        String(10), nullable=False, default="month"
    )
    trial_days: Mapped[int] = mapped_column(Integer, nullable=False)

    automatic_renewal_accepted: Mapped[bool] = mapped_column(
        Boolean, nullable=False
    )

    accepted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    # Hash, no la IP en claro — mismo criterio que
    # email_verification_service.hash_ip para el resto de la app.
    ip_address_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
