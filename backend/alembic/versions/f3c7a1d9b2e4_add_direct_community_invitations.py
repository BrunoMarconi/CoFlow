"""add direct community invitations

Revision ID: f3c7a1d9b2e4
Revises: a6f2d9c4e8b1
Create Date: 2026-08-13 20:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f3c7a1d9b2e4"
down_revision: Union[str, Sequence[str], None] = "a6f2d9c4e8b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "community_invitations",
        sa.Column("invited_user_id", sa.UUID(), nullable=True),
    )
    op.create_foreign_key(
        "fk_community_invitations_invited_user_id_users",
        "community_invitations",
        "users",
        ["invited_user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index(
        "ix_community_invitations_invited_user_id",
        "community_invitations",
        ["invited_user_id"],
        unique=False,
    )
    op.execute(
        "ALTER TYPE notification_type ADD VALUE IF NOT EXISTS "
        "'COMMUNITY_INVITATION_RECEIVED'"
    )
    op.execute(
        "ALTER TYPE notification_type ADD VALUE IF NOT EXISTS "
        "'COMMUNITY_MEMBER_REMOVED'"
    )
    op.execute(
        "ALTER TYPE notification_type ADD VALUE IF NOT EXISTS "
        "'COMMUNITY_OWNERSHIP_TRANSFERRED'"
    )


def downgrade() -> None:
    op.drop_index(
        "ix_community_invitations_invited_user_id",
        table_name="community_invitations",
    )
    op.drop_constraint(
        "fk_community_invitations_invited_user_id_users",
        "community_invitations",
        type_="foreignkey",
    )
    op.drop_column("community_invitations", "invited_user_id")

