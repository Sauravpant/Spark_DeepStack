import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.customer import Customer
from backend.app.models.product import Product
from backend.app.models.user import User
from db.database import Base

class LocationType(str, enum.Enum):
    URBAN = "urban"
    SEMI_URBAN = "semi_urban"
    RURAL = "rural"

class Shop(Base):
    __tablename__ = "shops"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    shop_name: Mapped[str] = mapped_column(String(150))
    address: Mapped[str] = mapped_column(Text)
    location_type: Mapped[LocationType] = mapped_column(Enum(LocationType))
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    user: Mapped["User"] = relationship(back_populates="shops")
    customers: Mapped[list["Customer"]] = relationship(back_populates="shop") 
    products: Mapped[list["Product"]] = relationship(back_populates="shop")