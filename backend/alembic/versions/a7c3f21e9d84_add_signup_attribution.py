"""add signup attribution columns to users

Origen de adquisicion de cada cuenta (de que campana vino quien se
registro). Las tres columnas son nullable y sin valor por defecto: las
cuentas existentes se quedan a NULL, que es exactamente lo que queremos
decir — "no sabemos de donde vino". No hay backfill posible ni deseable.

Son datos de marketing; no se usan para permisos ni seguridad.

Revision ID: a7c3f21e9d84
Revises: 0f6d8a21c4b9
Create Date: 2026-09-28 12:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a7c3f21e9d84"
down_revision: Union[str, Sequence[str], None] = "0f6d8a21c4b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("signup_source", sa.String(length=64), nullable=True))
    op.add_column("users", sa.Column("signup_medium", sa.String(length=64), nullable=True))
    op.add_column("users", sa.Column("signup_campaign", sa.String(length=64), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "signup_campaign")
    op.drop_column("users", "signup_medium")
    op.drop_column("users", "signup_source")
