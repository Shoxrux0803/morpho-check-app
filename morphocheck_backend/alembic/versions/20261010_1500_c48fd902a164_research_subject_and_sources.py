"""Persist research subject codes and measurement origins."""
import sqlalchemy as sa
from alembic import op

revision = "c48fd902a164"
down_revision = "91e72f61c201"
branch_labels = None
depends_on = None


def upgrade():
    columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("research_records")}
    with op.batch_alter_table("research_records") as batch:
        if "subject_code" not in columns:
            batch.add_column(sa.Column("subject_code", sa.String(80), nullable=True))
        if "measurement_sources" not in columns:
            batch.add_column(sa.Column("measurement_sources", sa.JSON(), nullable=True))
    indexes = {index["name"] for index in sa.inspect(op.get_bind()).get_indexes("research_records")}
    if "ix_research_records_subject_code" not in indexes:
        op.create_index("ix_research_records_subject_code", "research_records", ["subject_code"])


def downgrade():
    with op.batch_alter_table("research_records") as batch:
        batch.drop_index("ix_research_records_subject_code")
        batch.drop_column("measurement_sources")
        batch.drop_column("subject_code")
