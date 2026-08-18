"""add community closed notification type

Revision ID: d1a9c4f7b3e2
Revises: c8f1a4d6e2b9
Create Date: 2026-08-18 12:00:00
"""

from typing import Sequence, Union

from alembic import op


revision: str = "d1a9c4f7b3e2"
down_revision: Union[str, Sequence[str], None] = "c8f1a4d6e2b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'COMMUNITY_CLOSED'"
    )


def downgrade() -> None:
    # Postgres no permite quitar un valor de un ENUM sin recrear el
    # tipo entero — igual que el resto de migraciones de este proyecto
    # que añaden valores a notification_type, downgrade se deja vacío
    # a propósito.
    pass
