"""add user interests and profile visibility

Revision ID: 4d8f7a2c1e90
Revises: f3c7a1d9b2e4
Create Date: 2026-08-13 23:40:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "4d8f7a2c1e90"
down_revision: Union[str, Sequence[str], None] = "f3c7a1d9b2e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    profile_visibility = sa.Enum("PUBLIC", "CONNECTIONS", name="profile_visibility")
    profile_visibility.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "users",
        sa.Column("interests", sa.JSON(), server_default=sa.text("'[]'"), nullable=False),
    )
    op.add_column(
        "users",
        sa.Column(
            "profile_visibility",
            profile_visibility,
            server_default="PUBLIC",
            nullable=False,
        ),
    )
    op.create_index("ix_users_profile_visibility", "users", ["profile_visibility"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_users_profile_visibility", table_name="users")
    op.drop_column("users", "profile_visibility")
    op.drop_column("users", "interests")
    sa.Enum(name="profile_visibility").drop(op.get_bind(), checkfirst=True)
