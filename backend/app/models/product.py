import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    shop_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("shops.id"))
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("categories.id"))

    product_name: Mapped[str] = mapped_column(String(150))
    sku: Mapped[str] = mapped_column(String(50), unique=True)
    barcode: Mapped[str | None] = mapped_column(String(100), nullable=True)
    unit: Mapped[str] = mapped_column(String(20))

    stock_quantity: Mapped[int] = mapped_column(Integer, default=0)
    cost_price: Mapped[float] = mapped_column(Numeric(10, 2))
    selling_price: Mapped[float] = mapped_column(Numeric(10, 2))
    reorder_level: Mapped[int] = mapped_column(Integer, default=0)

    is_staple: Mapped[bool] = mapped_column(Boolean, default=False)
    is_perishable: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    shop: Mapped["Shop"] = relationship(back_populates="products")
    category: Mapped["Category"] = relationship(back_populates="products")