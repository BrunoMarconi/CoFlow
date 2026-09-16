"""add admin matching panel

Revision ID: 0f6d8a21c4b9
Revises: b4e8c1f7a926
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0f6d8a21c4b9"
down_revision: Union[str, Sequence[str], None] = "b4e8c1f7a926"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    user_status = postgresql.ENUM(
        "NEW", "INCOMPLETE", "LOOKING", "MATCH_FOUND", "CONTACTED", "IN_COMMUNITY", "PAUSED",
        name="user_admin_status", create_type=False,
    )
    community_status = postgresql.ENUM("FORMING", "FORMED", name="community_formation_status", create_type=False)
    review_status = postgresql.ENUM("SAVED", "DISMISSED", "PROPOSED", name="admin_match_review_status", create_type=False)
    bind = op.get_bind()
    user_status.create(bind, checkfirst=True)
    community_status.create(bind, checkfirst=True)
    review_status.create(bind, checkfirst=True)

    op.add_column("users", sa.Column("admin_status", user_status, nullable=False, server_default="NEW"))
    op.create_index("ix_users_admin_status", "users", ["admin_status"])
    op.execute("UPDATE users SET admin_status = 'INCOMPLETE' WHERE onboarding_completed = false")
    op.execute("UPDATE users SET admin_status = 'LOOKING' WHERE onboarding_completed = true AND is_looking_for_roommates = true")
    op.execute("UPDATE users SET admin_status = 'PAUSED' WHERE is_looking_for_roommates = false")
    op.execute("UPDATE users SET admin_status = 'IN_COMMUNITY' WHERE id IN (SELECT user_id FROM community_members)")

    op.add_column("communities", sa.Column("formation_status", community_status, nullable=False, server_default="FORMING"))
    op.create_index("ix_communities_formation_status", "communities", ["formation_status"])
    op.execute("UPDATE communities SET formation_status = 'FORMED' WHERE open_spots = 0")

    op.create_table(
        "admin_match_reviews",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("candidate_user_id", sa.UUID(), nullable=False),
        sa.Column("status", review_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["candidate_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "candidate_user_id", name="uq_admin_match_review_pair"),
    )
    op.create_index("ix_admin_match_reviews_user_id", "admin_match_reviews", ["user_id"])
    op.create_index("ix_admin_match_reviews_candidate_user_id", "admin_match_reviews", ["candidate_user_id"])


def downgrade() -> None:
    op.drop_index("ix_admin_match_reviews_candidate_user_id", table_name="admin_match_reviews")
    op.drop_index("ix_admin_match_reviews_user_id", table_name="admin_match_reviews")
    op.drop_table("admin_match_reviews")
    op.drop_index("ix_communities_formation_status", table_name="communities")
    op.drop_column("communities", "formation_status")
    op.drop_index("ix_users_admin_status", table_name="users")
    op.drop_column("users", "admin_status")
    bind = op.get_bind()
    sa.Enum(name="admin_match_review_status").drop(bind, checkfirst=True)
    sa.Enum(name="community_formation_status").drop(bind, checkfirst=True)
    sa.Enum(name="user_admin_status").drop(bind, checkfirst=True)
