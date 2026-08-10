"""add user age occupation bio last_active

Revision ID: 7c4a999cf73c
Revises: b749134c1eb7
Create Date: 2026-08-10 15:35:51.817700

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7c4a999cf73c'
down_revision: Union[str, Sequence[str], None] = 'b749134c1eb7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('age', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('occupation', sa.String(length=100), nullable=True))
    op.add_column('users', sa.Column('bio', sa.String(length=160), nullable=True))
    op.add_column('users', sa.Column('last_active_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'last_active_at')
    op.drop_column('users', 'bio')
    op.drop_column('users', 'occupation')
    op.drop_column('users', 'age')
