"""add_id_code_to_research_record

Revision ID: f9ae2b291405
Revises: 20260611_0001
Create Date: 2026-06-22 15:37:55.313933

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f9ae2b291405'
down_revision: Union[str, Sequence[str], None] = '20260611_0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('research_records', schema=None) as batch_op:
        batch_op.add_column(sa.Column('id_code', sa.String(length=50), nullable=True))
        batch_op.create_index(batch_op.f('ix_research_records_id_code'), ['id_code'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('research_records', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_research_records_id_code'))
        batch_op.drop_column('id_code')
