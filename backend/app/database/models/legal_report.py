from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


LEGAL_REPORT_CONTENT_TYPES = ("PROFILE", "PROPERTY", "COMMUNITY", "OTHER")


class LegalReport(Base):
    """Denuncia de contenido potencialmente ilegal (art. 16 DSA):
    accesible sin sesión iniciada, por eso reporter_id no existe — solo
    nombre/email de contacto opcionales, tal y como los facilite quien
    denuncia."""

    __tablename__ = "legal_reports"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )
    content_type: Mapped[str] = mapped_column(
        Enum(*LEGAL_REPORT_CONTENT_TYPES, name="legal_report_content_type"),
        nullable=False,
    )
    url_or_location: Mapped[str] = mapped_column(
        String(2000),
        nullable=False,
    )
    reason: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    additional_info: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    reporter_name: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )
    reporter_email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    evidence_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    evidence_storage_key: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    good_faith_declared: Mapped[bool] = mapped_column(
        nullable=False,
        default=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
