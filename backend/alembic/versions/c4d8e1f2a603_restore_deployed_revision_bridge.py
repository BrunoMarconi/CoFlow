"""restore deployed revision bridge

Revision ID: c4d8e1f2a603
Revises: a8e4c2d1f730

Some deployed databases were stamped with this revision after the owner
claim-token migration, but the revision file was never committed.  The
database contains no schema changes beyond ``a8e4c2d1f730`` at this point,
so this compatibility revision intentionally performs no DDL.  Keeping the
identifier in the canonical history lets those databases advance normally
without an unsafe manual stamp.
"""

from typing import Sequence, Union


revision: str = "c4d8e1f2a603"
down_revision: Union[str, Sequence[str], None] = "a8e4c2d1f730"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
