"""add property billing consent

Revision ID: c8f1a4d6e2b9
Revises: a2d8e5c1f9b7
Create Date: 2026-08-18 10:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c8f1a4d6e2b9"
down_revision: Union[str, Sequence[str], None] = "a2d8e5c1f9b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "property_billing_consents",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("owner_id", sa.UUID(), nullable=False),
        sa.Column("property_id", sa.Integer(), nullable=False),
        sa.Column("terms_version", sa.String(length=20), nullable=False),
        sa.Column("owner_terms_version", sa.String(length=20), nullable=False),
        sa.Column("price_accepted", sa.Numeric(10, 2), nullable=False),
        sa.Column(
            "currency", sa.String(length=3), nullable=False, server_default="EUR"
        ),
        sa.Column(
            "billing_interval",
            sa.String(length=10),
            nullable=False,
            server_default="month",
        ),
        sa.Column("trial_days", sa.Integer(), nullable=False),
        sa.Column("automatic_renewal_accepted", sa.Boolean(), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ip_address_hash", sa.String(length=64), nullable=True),
        sa.Column("user_agent", sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="CASCADE"),
    )
    op.create_index(
        "ix_property_billing_consents_owner_id",
        "property_billing_consents",
        ["owner_id"],
    )
    op.create_index(
        "ix_property_billing_consents_property_id",
        "property_billing_consents",
        ["property_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_property_billing_consents_property_id",
        table_name="property_billing_consents",
    )
    op.drop_index(
        "ix_property_billing_consents_owner_id",
        table_name="property_billing_consents",
    )
    op.drop_table("property_billing_consents")
