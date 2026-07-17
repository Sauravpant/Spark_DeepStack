"""Add transaction type for sale and purchase rows

Revision ID: b91c4d0c8e12
Revises: 52df89a7b7a2
Create Date: 2026-07-18 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b91c4d0c8e12"
down_revision: Union[str, Sequence[str], None] = "52df89a7b7a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


transaction_type_enum = sa.Enum("SALE", "PURCHASE", name="transactiontype")


def upgrade() -> None:
    transaction_type_enum.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "transactions",
        sa.Column(
            "transaction_type",
            transaction_type_enum,
            nullable=False,
            server_default="SALE",
        ),
    )


def downgrade() -> None:
    op.drop_column("transactions", "transaction_type")
    transaction_type_enum.drop(op.get_bind(), checkfirst=True)