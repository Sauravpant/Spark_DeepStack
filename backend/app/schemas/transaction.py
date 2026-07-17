import uuid
from datetime import date, datetime, timezone
from pydantic import BaseModel, field_serializer
from app.models.enums import PaymentType, CreditStatus, TransactionType


# ---- Request Schemas ----

class TransactionItemCreateRequest(BaseModel):
    product_id: uuid.UUID
    quantity: int


class TransactionCreateRequest(BaseModel):
    customer_id: uuid.UUID | None = None
    transaction_type: TransactionType = TransactionType.SALE
    payment_type: PaymentType
    discount: float = 0.00
    notes: str | None = None
    items: list[TransactionItemCreateRequest]
    # For credit sales
    due_date: date | None = None


# ---- Response Schemas ----

class TransactionItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    unit_price: float
    subtotal: float

    model_config = {"from_attributes": True}


class CreditSaleResponse(BaseModel):
    id: uuid.UUID
    credit_amount: float
    due_date: date
    paid_at: datetime | None = None
    status: CreditStatus
    remarks: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TransactionResponse(BaseModel):
    id: uuid.UUID
    shop_id: uuid.UUID
    customer_id: uuid.UUID | None = None
    transaction_type: TransactionType
    payment_type: PaymentType
    subtotal: float
    discount: float
    total_amount: float
    notes: str | None = None
    created_at: datetime
    items: list[TransactionItemResponse] = []
    credit_sale: CreditSaleResponse | None = None

    @field_serializer("created_at")
    def serialize_created_at(self, v: datetime, _info) -> str:
        # Ensure UTC timezone info is always included in the serialized output
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        return v.isoformat()

    model_config = {"from_attributes": True}


class CreditSaleUpdateRequest(BaseModel):
    status: CreditStatus | None = None
    remarks: str | None = None
