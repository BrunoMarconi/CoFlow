"""add privacy-conscious product analytics events

Revision ID: 4ea1c9b82d70
Revises: c4d8e1f2a603
Create Date: 2026-09-04 14:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "4ea1c9b82d70"
down_revision: Union[str, Sequence[str], None] = "c4d8e1f2a603"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "product_events",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column("anonymous_session_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=True),
        sa.Column("path", sa.String(length=255), nullable=True),
        sa.Column("source", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id"),
    )
    op.create_index("ix_product_events_created_at", "product_events", ["created_at"])
    op.create_index(
        "ix_product_events_name_created_at",
        "product_events",
        ["name", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_product_events_name_created_at", table_name="product_events")
    op.drop_index("ix_product_events_created_at", table_name="product_events")
    op.drop_table("product_events")
