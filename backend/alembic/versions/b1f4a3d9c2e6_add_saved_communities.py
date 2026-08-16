"""add saved_communities table

Revision ID: b1f4a3d9c2e6
Revises: 9c1d6e4a72fb
Create Date: 2026-08-16 12:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "b1f4a3d9c2e6"
down_revision: Union[str, Sequence[str], None] = "9c1d6e4a72fb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "saved_communities",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("community_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["community_id"], ["communities.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id", "community_id",
            name="uq_saved_communities_user_community",
        ),
    )
    op.create_index(
        op.f("ix_saved_communities_user_id"),
        "saved_communities",
        ["user_id"],
    )
    op.create_index(
        op.f("ix_saved_communities_community_id"),
        "saved_communities",
        ["community_id"],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_saved_communities_community_id"), table_name="saved_communities")
    op.drop_index(op.f("ix_saved_communities_user_id"), table_name="saved_communities")
    op.drop_table("saved_communities")
