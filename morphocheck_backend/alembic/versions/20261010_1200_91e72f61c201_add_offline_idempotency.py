"""Add per-user offline submission idempotency.

Revision ID: 91e72f61c201
Revises: 7c4e1f9a2b31
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "91e72f61c201"
down_revision: Union[str, Sequence[str], None] = "7c4e1f9a2b31"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("patient_analysis") as batch_op:
        batch_op.add_column(
            sa.Column("offline_submission_id", sa.String(length=120), nullable=True)
        )
        batch_op.create_index(
            "uq_patient_analysis_owner_offline_submission",
            ["created_by_id", "offline_submission_id"],
            unique=True,
        )


def downgrade() -> None:
    with op.batch_alter_table("patient_analysis") as batch_op:
        batch_op.drop_index("uq_patient_analysis_owner_offline_submission")
        batch_op.drop_column("offline_submission_id")
