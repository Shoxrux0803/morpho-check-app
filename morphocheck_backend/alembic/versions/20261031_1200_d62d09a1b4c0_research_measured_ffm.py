"""Add the measured FFM input required by the v6 author indices."""

import sqlalchemy as sa

from alembic import op

revision = "d62d09a1b4c0"
down_revision = "c48fd902a164"
branch_labels = None
depends_on = None


def upgrade():
    columns = {
        column["name"]
        for column in sa.inspect(op.get_bind()).get_columns("research_records")
    }
    if "ffm_measured_kg" not in columns:
        op.add_column(
            "research_records", sa.Column("ffm_measured_kg", sa.Float(), nullable=True)
        )


def downgrade():
    with op.batch_alter_table("research_records") as batch:
        batch.drop_column("ffm_measured_kg")
