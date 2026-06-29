"""Add play_preschool_engagement

Revision ID: ba0934a9b02a
Revises: c3a845f199c5
Create Date: 2026-06-25 19:30:54.583212

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ba0934a9b02a'
down_revision: Union[str, Sequence[str], None] = 'c3a845f199c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('patient_analysis', schema=None) as batch_op:
        batch_op.add_column(sa.Column('play_preschool_engagement', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('patient_analysis', schema=None) as batch_op:
        batch_op.drop_column('play_preschool_engagement')
