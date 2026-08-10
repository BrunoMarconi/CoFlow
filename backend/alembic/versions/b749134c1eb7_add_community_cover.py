"""add community cover

Revision ID: b749134c1eb7
Revises: 7189a36a19c2
Create Date: 2026-08-10 03:53:00.343810

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b749134c1eb7'
down_revision: Union[str, Sequence[str], None] = '7189a36a19c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'communities',
        sa.Column(
            'cover_color',
            sa.String(length=20),
            nullable=False,
            server_default='sage',
        ),
    )
    op.add_column(
        'communities',
        sa.Column('cover_image_url', sa.String(length=500), nullable=True),
    )
    op.add_column(
        'communities',
        sa.Column('cover_storage_key', sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('communities', 'cover_storage_key')
    op.drop_column('communities', 'cover_image_url')
    op.drop_column('communities', 'cover_color')
