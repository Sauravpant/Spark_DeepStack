import uuid
from sqlalchemy import Integer, Numeric, ForeignKey, Transaction
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.product import Product
from db.database import Base

class TransactionItem(Base):
    __tablename__ = "transaction_items"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    transaction_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("transactions.id"))
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id"))
    
    quantity: Mapped[int] = mapped_column(Integer)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2))
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2))

    # Relationships
    transaction: Mapped["Transaction"] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship()