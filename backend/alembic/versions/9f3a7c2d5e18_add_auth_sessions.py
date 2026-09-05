"""add revocable auth sessions

Revision ID: 9f3a7c2d5e18
Revises: 6b2d9e4f1a73
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "9f3a7c2d5e18"
down_revision: Union[str, Sequence[str], None] = "6b2d9e4f1a73"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("auth_sessions", sa.Column("id", sa.UUID(), nullable=False), sa.Column("user_id", sa.UUID(), nullable=False), sa.Column("device_label", sa.String(120), nullable=False), sa.Column("browser_label", sa.String(80), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False), sa.Column("last_active_at", sa.DateTime(timezone=True), nullable=False), sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True), sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"), sa.PrimaryKeyConstraint("id"))
    op.create_index("ix_auth_sessions_user_id", "auth_sessions", ["user_id"])
    op.create_index("ix_auth_sessions_last_active_at", "auth_sessions", ["last_active_at"])


def downgrade() -> None:
    op.drop_table("auth_sessions")
