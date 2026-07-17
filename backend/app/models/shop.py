import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
from app.models.enums import LocationType


class Shop(Base):
    __tablename__ = "shops"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    shop_name: Mapped[str] = mapped_column(String(150))
    address: Mapped[str] = mapped_column(Text)
    location_type: Mapped[LocationType] = mapped_column(SAEnum(LocationType))

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    user: Mapped["User"] = relationship(back_populates="shops")
    customers: Mapped[list["Customer"]] = relationship(back_populates="shop")
    products: Mapped[list["Product"]] = relationship(back_populates="shop")