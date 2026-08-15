"""add legal consent fields and legal reports table

Revision ID: 9c1d6e4a72fb
Revises: 4d8f7a2c1e90
Create Date: 2026-08-15 18:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "9c1d6e4a72fb"
down_revision: Union[str, Sequence[str], None] = "4d8f7a2c1e90"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("birth_date", sa.Date(), nullable=True))
    op.add_column("users", sa.Column("terms_version", sa.String(length=20), nullable=True))
    op.add_column("users", sa.Column("terms_accepted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("privacy_version", sa.String(length=20), nullable=True))
    op.add_column(
        "users",
        sa.Column("marketing_consent", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )
    op.add_column("users", sa.Column("marketing_consent_at", sa.DateTime(timezone=True), nullable=True))

    postgresql.ENUM(
        "PROFILE", "PROPERTY", "COMMUNITY", "OTHER",
        name="legal_report_content_type",
    ).create(op.get_bind(), checkfirst=True)

    op.create_table(
        "legal_reports",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column(
            "content_type",
            postgresql.ENUM(
                "PROFILE", "PROPERTY", "COMMUNITY", "OTHER",
                name="legal_report_content_type",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column("url_or_location", sa.String(length=2000), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("additional_info", sa.Text(), nullable=True),
        sa.Column("reporter_name", sa.String(length=200), nullable=True),
        sa.Column("reporter_email", sa.String(length=255), nullable=True),
        sa.Column("evidence_url", sa.String(length=500), nullable=True),
        sa.Column("evidence_storage_key", sa.String(length=255), nullable=True),
        sa.Column("good_faith_declared", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("legal_reports")
    postgresql.ENUM(name="legal_report_content_type").drop(op.get_bind(), checkfirst=True)

    op.drop_column("users", "marketing_consent_at")
    op.drop_column("users", "marketing_consent")
    op.drop_column("users", "privacy_version")
    op.drop_column("users", "terms_accepted_at")
    op.drop_column("users", "terms_version")
    op.drop_column("users", "birth_date")
