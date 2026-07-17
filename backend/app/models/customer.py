import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, Numeric, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    shop_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("shops.id"))
    full_name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)

    credit_limit: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    current_outstanding_balance: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    max_outstanding_ever: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    shop: Mapped["Shop"] = relationship(back_populates="customers")
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="customer")
    credit_predictions: Mapped[list["CreditPrediction"]] = relationship(back_populates="customer")