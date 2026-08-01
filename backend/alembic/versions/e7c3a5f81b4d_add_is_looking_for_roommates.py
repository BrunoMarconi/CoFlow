"""add is_looking_for_roommates to users

Revision ID: e7c3a5f81b4d
Revises: d4e7b2a91f0c
Create Date: 2026-07-31 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e7c3a5f81b4d'
down_revision: Union[str, Sequence[str], None] = 'd4e7b2a91f0c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'users',
        sa.Column(
            'is_looking_for_roommates',
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        )
    )
    op.create_index(
        op.f('ix_users_is_looking_for_roommates'),
        'users',
        ['is_looking_for_roommates'],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        op.f('ix_users_is_looking_for_roommates'),
        table_name='users',
    )
    op.drop_column('users', 'is_looking_for_roommates')
