"""add user avatar and photos

Revision ID: 7189a36a19c2
Revises: 1217edfac76b
Create Date: 2026-08-06 13:06:26.482886

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7189a36a19c2'
down_revision: Union[str, Sequence[str], None] = '1217edfac76b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'users',
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
    )
    op.add_column(
        'users',
        sa.Column('avatar_storage_key', sa.String(length=255), nullable=True),
    )

    op.create_table(
        'user_photos',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('storage_key', sa.String(length=255), nullable=False),
        sa.Column('image_url', sa.String(length=500), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_user_photos_user_id'), 'user_photos', ['user_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_user_photos_user_id'), table_name='user_photos')
    op.drop_table('user_photos')

    op.drop_column('users', 'avatar_storage_key')
    op.drop_column('users', 'avatar_url')
