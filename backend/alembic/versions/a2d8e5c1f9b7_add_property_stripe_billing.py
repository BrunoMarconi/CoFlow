"""add property stripe billing

Revision ID: a2d8e5c1f9b7
Revises: b1f4a3d9c2e6
Create Date: 2026-08-17 12:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a2d8e5c1f9b7"
down_revision: Union[str, Sequence[str], None] = "b1f4a3d9c2e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


property_subscription_status = sa.Enum(
    "NONE",
    "TRIALING",
    "ACTIVE",
    "PAST_DUE",
    "CANCELED",
    name="property_subscription_status",
)


def upgrade() -> None:
    op.add_column(
        "owner_profiles",
        sa.Column("stripe_customer_id", sa.String(length=255), nullable=True),
    )

    property_subscription_status.create(op.get_bind())

    op.add_column(
        "properties",
        sa.Column(
            "stripe_subscription_id", sa.String(length=255), nullable=True
        ),
    )
    op.add_column(
        "properties",
        sa.Column(
            "subscription_status",
            property_subscription_status,
            nullable=False,
            server_default="NONE",
        ),
    )
    op.alter_column("properties", "subscription_status", server_default=None)
    op.add_column(
        "properties",
        sa.Column("trial_ends_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("properties", "trial_ends_at")
    op.drop_column("properties", "subscription_status")
    op.drop_column("properties", "stripe_subscription_id")

    property_subscription_status.drop(op.get_bind())

    op.drop_column("owner_profiles", "stripe_customer_id")
