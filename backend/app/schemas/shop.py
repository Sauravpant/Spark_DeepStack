import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.enums import LocationType


# ---- Request Schemas ----

class ShopCreateRequest(BaseModel):
    shop_name: str
    address: str
    location_type: LocationType


class ShopUpdateRequest(BaseModel):
    shop_name: str | None = None
    address: str | None = None
    location_type: LocationType | None = None


# ---- Response Schemas ----

class ShopResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    shop_name: str
    address: str
    location_type: LocationType
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
