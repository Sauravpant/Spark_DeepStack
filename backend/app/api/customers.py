import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.customer import CustomerCreateRequest, CustomerUpdateRequest, CustomerResponse
from app.schemas.response import ApiResponse
import app.services.customer_service as customer_service
router = APIRouter(prefix="/shops/{shop_id}/customers", tags=["Customers"])


@router.post("/", response_model=ApiResponse[CustomerResponse], status_code=201)
def create_customer(
    shop_id: uuid.UUID,
    payload: CustomerCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = customer_service.create_customer(db, current_user, shop_id, payload)
    return ApiResponse(
        message="Customer created successfully",
        data=CustomerResponse.model_validate(customer),
    )


@router.get("/", response_model=ApiResponse[list[CustomerResponse]])
def get_customers(
    shop_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customers = customer_service.get_customers(db, current_user, shop_id)
    return ApiResponse(
        message="Customers fetched",
        data=[CustomerResponse.model_validate(c) for c in customers],
    )


@router.get("/{customer_id}", response_model=ApiResponse[CustomerResponse])
def get_customer(
    shop_id: uuid.UUID,
    customer_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = customer_service.get_customer_by_id(db, current_user, shop_id, customer_id)
    return ApiResponse(
        message="Customer fetched",
        data=CustomerResponse.model_validate(customer),
    )


@router.patch("/{customer_id}", response_model=ApiResponse[CustomerResponse])
def update_customer(
    shop_id: uuid.UUID,
    customer_id: uuid.UUID,
    payload: CustomerUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = customer_service.update_customer(db, current_user, shop_id, customer_id, payload)
    return ApiResponse(
        message="Customer updated successfully",
        data=CustomerResponse.model_validate(customer),
    )


@router.delete("/{customer_id}", response_model=ApiResponse)
def delete_customer(
    shop_id: uuid.UUID,
    customer_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer_service.delete_customer(db, current_user, shop_id, customer_id)
    return ApiResponse(message="Customer deactivated successfully")
