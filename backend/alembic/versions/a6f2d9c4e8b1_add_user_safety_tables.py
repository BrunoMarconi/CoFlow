"""add user safety tables

Revision ID: a6f2d9c4e8b1
Revises: 7c4a999cf73c
Create Date: 2026-08-13 16:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a6f2d9c4e8b1"
down_revision: Union[str, Sequence[str], None] = "7c4a999cf73c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_blocks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("blocker_id", sa.UUID(), nullable=False),
        sa.Column("blocked_user_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["blocked_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["blocker_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "blocker_id",
            "blocked_user_id",
            name="uq_user_blocks_blocker_blocked",
        ),
    )
    op.create_index("ix_user_blocks_blocker_id", "user_blocks", ["blocker_id"])
    op.create_index(
        "ix_user_blocks_blocked_user_id",
        "user_blocks",
        ["blocked_user_id"],
    )

    op.create_table(
        "user_reports",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("reporter_id", sa.UUID(), nullable=False),
        sa.Column("reported_user_id", sa.UUID(), nullable=False),
        sa.Column("reason", sa.String(length=40), nullable=False),
        sa.Column("details", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["reported_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reporter_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_reports_reporter_id", "user_reports", ["reporter_id"])
    op.create_index(
        "ix_user_reports_reported_user_id",
        "user_reports",
        ["reported_user_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_user_reports_reported_user_id", table_name="user_reports")
    op.drop_index("ix_user_reports_reporter_id", table_name="user_reports")
    op.drop_table("user_reports")
    op.drop_index("ix_user_blocks_blocked_user_id", table_name="user_blocks")
    op.drop_index("ix_user_blocks_blocker_id", table_name="user_blocks")
    op.drop_table("user_blocks")
