"""add email verification

Revision ID: 1217edfac76b
Revises: 238f173a7fd3
Create Date: 2026-08-04 22:46:21.151762

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1217edfac76b'
down_revision: Union[str, Sequence[str], None] = '238f173a7fd3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('email_verification_tokens',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('token_hash', sa.String(length=64), nullable=False),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('requested_ip_hash', sa.String(length=64), nullable=True),
    sa.Column('resend_count', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_email_verification_tokens_expires_at'), 'email_verification_tokens', ['expires_at'], unique=False)
    op.create_index(op.f('ix_email_verification_tokens_token_hash'), 'email_verification_tokens', ['token_hash'], unique=True)
    op.create_index(op.f('ix_email_verification_tokens_user_id'), 'email_verification_tokens', ['user_id'], unique=False)

    # Renombra en vez de borrar+crear: is_verified ya existía (Boolean,
    # NOT NULL, default False) pero no se usaba en ningún sitio del
    # código — coincide exactamente con lo que necesitamos para
    # is_email_verified, así que se reaprovecha la columna (y sus
    # valores) en vez de crear una redundante.
    op.alter_column(
        'users',
        'is_verified',
        new_column_name='is_email_verified',
    )
    op.add_column(
        'users',
        sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True),
    )

    # Backfill: todo usuario que ya existía antes de esta migración
    # queda marcado como verificado (is_verified nunca se usó realmente,
    # así que su valor previo no es representativo) para no bloquear
    # cuentas ya creadas. email_verified_at se fija a la fecha de esta
    # migración porque no se registró la fecha real de verificación
    # históricamente — es una aproximación explícita, no un dato real.
    op.execute(
        "UPDATE users SET is_email_verified = true, email_verified_at = now()"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'email_verified_at')
    op.alter_column(
        'users',
        'is_email_verified',
        new_column_name='is_verified',
    )

    op.drop_index(op.f('ix_email_verification_tokens_user_id'), table_name='email_verification_tokens')
    op.drop_index(op.f('ix_email_verification_tokens_token_hash'), table_name='email_verification_tokens')
    op.drop_index(op.f('ix_email_verification_tokens_expires_at'), table_name='email_verification_tokens')
    op.drop_table('email_verification_tokens')
