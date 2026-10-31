"""add supervisor_id

Revision ID: c3a845f199c5
Revises: f9ae2b291405
Create Date: 2026-06-22 19:45:42.565197

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'c3a845f199c5'
down_revision: Union[str, Sequence[str], None] = 'f9ae2b291405'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('plain_password', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('supervisor_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('admin_permissions', sa.Text(), nullable=True))
        batch_op.create_index(batch_op.f('ix_users_supervisor_id'), ['supervisor_id'], unique=False)
        batch_op.create_foreign_key('fk_users_supervisor_id_users', 'users', ['supervisor_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_constraint('fk_users_supervisor_id_users', type_='foreignkey')
        batch_op.drop_index(batch_op.f('ix_users_supervisor_id'))
        batch_op.drop_column('admin_permissions')
        batch_op.drop_column('supervisor_id')
        batch_op.drop_column('plain_password')
