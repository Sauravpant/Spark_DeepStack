import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.shop import ShopCreateRequest, ShopUpdateRequest, ShopResponse
from app.schemas.response import ApiResponse
import app.services.shop_service as shop_service
router = APIRouter(prefix="/shops", tags=["Shops"])


@router.post("/", response_model=ApiResponse[ShopResponse], status_code=201)
def create_shop(
    payload: ShopCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shop = shop_service.create_shop(db, current_user, payload)
    return ApiResponse(
        message="Shop created successfully",
        data=ShopResponse.model_validate(shop),
    )


@router.get("/", response_model=ApiResponse[list[ShopResponse]])
def get_shops(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shops = shop_service.get_user_shops(db, current_user)
    return ApiResponse(
        message="Shops fetched",
        data=[ShopResponse.model_validate(s) for s in shops],
    )


@router.get("/{shop_id}", response_model=ApiResponse[ShopResponse])
def get_shop(
    shop_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shop = shop_service.get_shop_by_id(db, current_user, shop_id)
    return ApiResponse(
        message="Shop fetched",
        data=ShopResponse.model_validate(shop),
    )


@router.patch("/{shop_id}", response_model=ApiResponse[ShopResponse])
def update_shop(
    shop_id: uuid.UUID,
    payload: ShopUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shop = shop_service.update_shop(db, current_user, shop_id, payload)
    return ApiResponse(
        message="Shop updated successfully",
        data=ShopResponse.model_validate(shop),
    )


@router.delete("/{shop_id}", response_model=ApiResponse)
def delete_shop(
    shop_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shop_service.delete_shop(db, current_user, shop_id)
    return ApiResponse(message="Shop deleted successfully")
