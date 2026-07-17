import uuid
import enum
from datetime import datetime
from sqlalchemy import Text, DateTime, Numeric, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.customer import Customer
from backend.app.models.transaction_item import TransactionItem
from backend.app.models.credit_sale import CreditSale
from db.database import Base

class PaymentType(str, enum.Enum):
    CASH = "CASH"
    CREDIT = "CREDIT"
    QR = "QR"

class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    shop_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("shops.id"))
    customer_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("customers.id"), nullable=True)
    
    payment_type: Mapped[PaymentType] = mapped_column(Enum(PaymentType))
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2))
    discount: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    customer: Mapped["Customer"] = relationship(back_populates="transactions")
    items: Mapped[list["TransactionItem"]] = relationship(back_populates="transaction")
    credit_sale: Mapped["CreditSale"] = relationship(back_populates="transaction", uselist=False)