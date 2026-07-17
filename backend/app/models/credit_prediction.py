import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Numeric, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db.database import Base
from backend.app.models.customer import Customer

class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class CreditPrediction(Base):
    __tablename__ = "credit_predictions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("customers.id"))
    
    risk_probability: Mapped[float] = mapped_column(Numeric(5, 4))
    risk_level: Mapped[RiskLevel] = mapped_column(Enum(RiskLevel))
    recommended_credit_limit: Mapped[float] = mapped_column(Numeric(10, 2))
    model_version: Mapped[str] = mapped_column(String(50))
    
    generated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    customer: Mapped["Customer"] = relationship(back_populates="credit_predictions")