import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.product import ProductCreateRequest, ProductUpdateRequest, ProductResponse, StockAdjustRequest
from app.schemas.response import ApiResponse
import app.services.product_service as product_service
router = APIRouter(prefix="/shops/{shop_id}/products", tags=["Products & Inventory"])


@router.post("/", response_model=ApiResponse[ProductResponse], status_code=201)
def create_product(
    shop_id: uuid.UUID,
    payload: ProductCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = product_service.create_product(db, current_user, shop_id, payload)
    return ApiResponse(
        message="Product created successfully",
        data=ProductResponse.model_validate(product),
    )


@router.get("/", response_model=ApiResponse[list[ProductResponse]])
def get_products(
    shop_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    products = product_service.get_products(db, current_user, shop_id)
    return ApiResponse(
        message="Products fetched",
        data=[ProductResponse.model_validate(p) for p in products],
    )


@router.get("/low-stock", response_model=ApiResponse[list[ProductResponse]])
def get_low_stock(
    shop_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    products = product_service.get_low_stock_products(db, current_user, shop_id)
    return ApiResponse(
        message="Low stock products fetched",
        data=[ProductResponse.model_validate(p) for p in products],
    )


@router.get("/{product_id}", response_model=ApiResponse[ProductResponse])
def get_product(
    shop_id: uuid.UUID,
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = product_service.get_product_by_id(db, current_user, shop_id, product_id)
    return ApiResponse(
        message="Product fetched",
        data=ProductResponse.model_validate(product),
    )


@router.patch("/{product_id}", response_model=ApiResponse[ProductResponse])
def update_product(
    shop_id: uuid.UUID,
    product_id: uuid.UUID,
    payload: ProductUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = product_service.update_product(db, current_user, shop_id, product_id, payload)
    return ApiResponse(
        message="Product updated successfully",
        data=ProductResponse.model_validate(product),
    )


@router.delete("/{product_id}", response_model=ApiResponse)
def delete_product(
    shop_id: uuid.UUID,
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product_service.delete_product(db, current_user, shop_id, product_id)
    return ApiResponse(message="Product deactivated successfully")


@router.post("/{product_id}/stock-in", response_model=ApiResponse[ProductResponse])
def stock_in(
    shop_id: uuid.UUID,
    product_id: uuid.UUID,
    payload: StockAdjustRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = product_service.stock_in(db, current_user, shop_id, product_id, payload)
    return ApiResponse(
        message="Stock added successfully",
        data=ProductResponse.model_validate(product),
    )


@router.post("/{product_id}/stock-out", response_model=ApiResponse[ProductResponse])
def stock_out(
    shop_id: uuid.UUID,
    product_id: uuid.UUID,
    payload: StockAdjustRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = product_service.stock_out(db, current_user, shop_id, product_id, payload)
    return ApiResponse(
        message="Stock removed successfully",
        data=ProductResponse.model_validate(product),
    )
