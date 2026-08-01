"""add community open spot details

Revision ID: a0d1adb6091d
Revises: 565695c4499d
Create Date: 2026-07-28 13:31:57.678396

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a0d1adb6091d'
down_revision: Union[str, Sequence[str], None] = '565695c4499d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    community_urgency = sa.Enum(
        "NORMAL",
        "SOON",
        "URGENT",
        name="community_urgency",
    )

    community_urgency.create(
        op.get_bind(),
        checkfirst=True,
    )

    op.add_column(
        "communities",
        sa.Column(
            "open_spots",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )

    op.add_column(
        "communities",
        sa.Column(
            "urgency",
            community_urgency,
            nullable=False,
            server_default="NORMAL",
        ),
    )

    op.add_column(
        "communities",
        sa.Column(
            "monthly_rent",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.add_column(
        "communities",
        sa.Column(
            "deposit",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.add_column(
        "communities",
        sa.Column(
            "move_in_date",
            sa.Date(),
            nullable=True,
        ),
    )

    op.add_column(
        "communities",
        sa.Column(
            "room_description",
            sa.Text(),
            nullable=True,
        ),
    )

    op.alter_column(
        "communities",
        "open_spots",
        server_default=None,
    )

    op.alter_column(
        "communities",
        "urgency",
        server_default=None,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("communities", "room_description")
    op.drop_column("communities", "move_in_date")
    op.drop_column("communities", "deposit")
    op.drop_column("communities", "monthly_rent")
    op.drop_column("communities", "urgency")
    op.drop_column("communities", "open_spots")

    sa.Enum(
        "NORMAL",
        "SOON",
        "URGENT",
        name="community_urgency",
    ).drop(
        op.get_bind(),
        checkfirst=True,
    )
