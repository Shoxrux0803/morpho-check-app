"""Preserve exact imported ages in months without changing legacy years."""

import sqlalchemy as sa

from alembic import op

revision = "e72e10b2c5d1"
down_revision = "d62d09a1b4c0"
branch_labels = None
depends_on = None


def upgrade():
    columns = {
        column["name"]
        for column in sa.inspect(op.get_bind()).get_columns("patient_analysis")
    }
    if "age_total_months" not in columns:
        op.add_column(
            "patient_analysis", sa.Column("age_total_months", sa.Float(), nullable=True)
        )


def downgrade():
    with op.batch_alter_table("patient_analysis") as batch:
        batch.drop_column("age_total_months")
