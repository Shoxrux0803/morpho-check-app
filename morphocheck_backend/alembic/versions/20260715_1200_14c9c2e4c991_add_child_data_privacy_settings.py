"""Add child data privacy setting to roles.

Revision ID: 14c9c2e4c991
Revises: ba0934a9b02a
Create Date: 2026-07-15 12:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "14c9c2e4c991"
down_revision: Union[str, Sequence[str], None] = "ba0934a9b02a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("role_settings", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "child_data_privacy_enabled",
                sa.Boolean(),
                nullable=False,
                server_default=sa.true(),
            )
        )
    op.execute(
        sa.text(
            "UPDATE role_settings SET child_data_privacy_enabled = false "
            "WHERE role_name = 'researcher'"
        )
    )


def downgrade() -> None:
    with op.batch_alter_table("role_settings", schema=None) as batch_op:
        batch_op.drop_column("child_data_privacy_enabled")
