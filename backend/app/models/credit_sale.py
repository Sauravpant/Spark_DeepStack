import uuid
from datetime import date, datetime
from sqlalchemy import Text, DateTime, Date, Numeric, ForeignKey, Enum as SAEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
from app.models.enums import CreditStatus


class CreditSale(Base):
    __tablename__ = "credit_sales"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    transaction_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("transactions.id"), unique=True)
    customer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("customers.id"))

    credit_amount: Mapped[float] = mapped_column(Numeric(10, 2))
    due_date: Mapped[date] = mapped_column(Date)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    status: Mapped[CreditStatus] = mapped_column(SAEnum(CreditStatus), default=CreditStatus.UNPAID)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    transaction: Mapped["Transaction"] = relationship(back_populates="credit_sale")
    customer: Mapped["Customer"] = relationship()