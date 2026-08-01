"""add community profile type

Revision ID: c1f4a9d2e6b3
Revises: b0824d3c7f7d
Create Date: 2026-07-29 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1f4a9d2e6b3'
down_revision: Union[str, Sequence[str], None] = 'b0824d3c7f7d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    profile_type_enum = sa.Enum(
        'STUDENTS',
        'YOUNG_PROFESSIONALS',
        'DIGITAL_NOMADS',
        'WORKERS',
        'EXAM_CANDIDATES',
        'INTERNATIONAL_STUDENTS',
        'MIXED',
        'OTHER',
        name='community_profile_type',
    )
    profile_type_enum.create(op.get_bind(), checkfirst=True)

    op.add_column(
        'communities',
        sa.Column(
            'profile_type',
            profile_type_enum,
            nullable=False,
            server_default='MIXED',
        )
    )
    op.add_column(
        'communities',
        sa.Column(
            'profile_description',
            sa.Text(),
            nullable=True,
        )
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('communities', 'profile_description')
    op.drop_column('communities', 'profile_type')

    sa.Enum(name='community_profile_type').drop(
        op.get_bind(), checkfirst=True
    )
