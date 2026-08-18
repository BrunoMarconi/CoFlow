"""add message replies and likes

Revision ID: e3b6d8a1c5f4
Revises: d1a9c4f7b3e2
Create Date: 2026-08-18 15:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e3b6d8a1c5f4"
down_revision: Union[str, Sequence[str], None] = "d1a9c4f7b3e2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    for table in ("community_messages", "private_messages"):
        op.add_column(
            table,
            sa.Column("reply_to_id", sa.Integer(), nullable=True),
        )
        op.create_foreign_key(
            f"fk_{table}_reply_to_id",
            table,
            table,
            ["reply_to_id"],
            ["id"],
            ondelete="SET NULL",
        )
        op.add_column(
            table,
            sa.Column(
                "liked_by_user_ids",
                sa.JSON(),
                nullable=False,
                server_default="[]",
            ),
        )
        op.alter_column(table, "liked_by_user_ids", server_default=None)


def downgrade() -> None:
    for table in ("community_messages", "private_messages"):
        op.drop_column(table, "liked_by_user_ids")
        op.drop_constraint(f"fk_{table}_reply_to_id", table, type_="foreignkey")
        op.drop_column(table, "reply_to_id")
