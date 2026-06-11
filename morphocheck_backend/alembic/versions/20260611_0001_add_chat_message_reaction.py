"""add_chat_message_reaction

Revision ID: 20260611_0001
Revises: e345db41c05e
Create Date: 2026-06-11 00:01:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "20260611_0001"
down_revision: Union[str, Sequence[str], None] = "e345db41c05e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("chat_messages", schema=None) as batch_op:
        batch_op.add_column(sa.Column("reaction", sa.String(length=8), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("chat_messages", schema=None) as batch_op:
        batch_op.drop_column("reaction")
