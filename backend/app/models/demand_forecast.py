import uuid
from datetime import date, datetime
from sqlalchemy import String, Integer, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


class DemandForecast(Base):
    __tablename__ = "demand_forecasts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    shop_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("shops.id"))
    product_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("products.id"), nullable=True)

    forecast_date: Mapped[date] = mapped_column(Date)
    predicted_quantity: Mapped[int] = mapped_column(Integer)
    confidence_score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    model_version: Mapped[str] = mapped_column(String(50))

    generated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    shop: Mapped["Shop"] = relationship()
    product: Mapped["Product"] = relationship()