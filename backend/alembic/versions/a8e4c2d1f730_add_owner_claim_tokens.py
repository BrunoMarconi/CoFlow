"""add owner claim tokens

Revision ID: a8e4c2d1f730
Revises: f0287af36243
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "a8e4c2d1f730"
down_revision: Union[str, None] = "f0287af36243"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "owner_claim_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("property_id", sa.Integer(), nullable=False),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("claimed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("owner_consent_recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("property_id"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index(op.f("ix_owner_claim_tokens_expires_at"), "owner_claim_tokens", ["expires_at"])
    op.create_index(op.f("ix_owner_claim_tokens_property_id"), "owner_claim_tokens", ["property_id"], unique=True)
    op.create_index(op.f("ix_owner_claim_tokens_token_hash"), "owner_claim_tokens", ["token_hash"], unique=True)
    op.create_index(op.f("ix_owner_claim_tokens_user_id"), "owner_claim_tokens", ["user_id"])


def downgrade() -> None:
    op.drop_table("owner_claim_tokens")
