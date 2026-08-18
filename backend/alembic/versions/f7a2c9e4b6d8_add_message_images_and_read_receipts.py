"""add message images and read receipts

Revision ID: f7a2c9e4b6d8
Revises: e3b6d8a1c5f4
Create Date: 2026-08-18 18:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f7a2c9e4b6d8"
down_revision: Union[str, Sequence[str], None] = "e3b6d8a1c5f4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("community_messages", sa.Column("image_url", sa.Text(), nullable=True))
    op.add_column("private_messages", sa.Column("image_url", sa.Text(), nullable=True))

    op.create_table(
        "community_message_reads",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("community_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("last_read_message_id", sa.Integer(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["community_id"], ["communities.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("community_id", "user_id", name="uq_community_message_reads_community_user"),
    )
    op.create_index(
        "ix_community_message_reads_community_id",
        "community_message_reads",
        ["community_id"],
    )
    op.create_index(
        "ix_community_message_reads_user_id",
        "community_message_reads",
        ["user_id"],
    )

    op.create_table(
        "private_message_reads",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("connection_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("last_read_message_id", sa.Integer(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["connection_id"], ["user_connections.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("connection_id", "user_id", name="uq_private_message_reads_connection_user"),
    )
    op.create_index(
        "ix_private_message_reads_connection_id",
        "private_message_reads",
        ["connection_id"],
    )
    op.create_index(
        "ix_private_message_reads_user_id",
        "private_message_reads",
        ["user_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_private_message_reads_user_id", table_name="private_message_reads")
    op.drop_index("ix_private_message_reads_connection_id", table_name="private_message_reads")
    op.drop_table("private_message_reads")

    op.drop_index("ix_community_message_reads_user_id", table_name="community_message_reads")
    op.drop_index("ix_community_message_reads_community_id", table_name="community_message_reads")
    op.drop_table("community_message_reads")

    op.drop_column("private_messages", "image_url")
    op.drop_column("community_messages", "image_url")
