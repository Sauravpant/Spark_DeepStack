import uuid
from datetime import datetime
from pydantic import BaseModel


# ---- Request Schemas ----

class ProductCreateRequest(BaseModel):
    category_id: uuid.UUID
    product_name: str
    sku: str
    barcode: str | None = None
    unit: str
    stock_quantity: int = 0
    cost_price: float
    selling_price: float
    reorder_level: int = 0
    is_staple: bool = False
    is_perishable: bool = False


class ProductUpdateRequest(BaseModel):
    category_id: uuid.UUID | None = None
    product_name: str | None = None
    sku: str | None = None
    barcode: str | None = None
    unit: str | None = None
    cost_price: float | None = None
    selling_price: float | None = None
    reorder_level: int | None = None
    is_staple: bool | None = None
    is_perishable: bool | None = None
    is_active: bool | None = None


class StockAdjustRequest(BaseModel):
    """For inventory input/output adjustments."""
    quantity: int
    reason: str | None = None


# ---- Response Schemas ----

class ProductResponse(BaseModel):
    id: uuid.UUID
    shop_id: uuid.UUID
    category_id: uuid.UUID
    product_name: str
    sku: str
    barcode: str | None = None
    unit: str
    stock_quantity: int
    cost_price: float
    selling_price: float
    reorder_level: int
    is_staple: bool
    is_perishable: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
