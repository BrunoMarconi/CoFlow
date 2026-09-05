"""add notification preferences

Revision ID: b4e8c1f7a926
Revises: 9f3a7c2d5e18
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "b4e8c1f7a926"
down_revision: Union[str, Sequence[str], None] = "9f3a7c2d5e18"
branch_labels = None
depends_on = None


def upgrade() -> None:
    default = '{"in_app_enabled":true,"email_enabled":true,"messages":true,"connections":true,"communities":true,"applications":true,"email_frequency":"immediate","quiet_hours_enabled":false,"quiet_hours_start":"22:00","quiet_hours_end":"08:00"}'
    op.add_column("users", sa.Column("notification_preferences", sa.JSON(), nullable=False, server_default=default))


def downgrade() -> None:
    op.drop_column("users", "notification_preferences")
