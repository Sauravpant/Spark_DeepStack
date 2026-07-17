import uuid
from datetime import datetime
from pydantic import BaseModel


# ---- Request Schemas ----

class CustomerCreateRequest(BaseModel):
    full_name: str
    phone: str | None = None
    address: str | None = None
    credit_limit: float = 0.00


class CustomerUpdateRequest(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    address: str | None = None
    credit_limit: float | None = None
    is_active: bool | None = None


# ---- Response Schemas ----

class CustomerResponse(BaseModel):
    id: uuid.UUID
    shop_id: uuid.UUID
    full_name: str
    phone: str | None = None
    address: str | None = None
    credit_limit: float
    current_outstanding_balance: float
    max_outstanding_ever: float
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
