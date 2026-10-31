"""Add canonical Body Composition/BIA raw and result storage.

Revision ID: 7c4e1f9a2b31
Revises: 14c9c2e4c991
Create Date: 2026-08-08 12:00:00
"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "7c4e1f9a2b31"
down_revision: Union[str, Sequence[str], None] = "14c9c2e4c991"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("patient_analysis") as batch_op:
        batch_op.add_column(sa.Column("body_composition_raw", sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column("body_composition_result", sa.JSON(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("patient_analysis") as batch_op:
        batch_op.drop_column("body_composition_result")
        batch_op.drop_column("body_composition_raw")
