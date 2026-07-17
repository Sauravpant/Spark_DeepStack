import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.enums import CreditStatus
from app.schemas.transaction import (
    TransactionCreateRequest,
    TransactionResponse,
    CreditSaleResponse,
    CreditSaleUpdateRequest,
)
from app.schemas.response import ApiResponse
import app.services.transaction_service as transaction_service
router = APIRouter(prefix="/shops/{shop_id}/transactions", tags=["Transactions & Credit Sales"])


@router.post("/", response_model=ApiResponse[TransactionResponse], status_code=201)
def create_transaction(
    shop_id: uuid.UUID,
    payload: TransactionCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = transaction_service.create_transaction(db, current_user, shop_id, payload)
    return ApiResponse(
        message="Transaction created successfully",
        data=TransactionResponse.model_validate(tx),
    )


@router.get("/", response_model=ApiResponse[list[TransactionResponse]])
def get_transactions(
    shop_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    txns = transaction_service.get_transactions(db, current_user, shop_id)
    return ApiResponse(
        message="Transactions fetched",
        data=[TransactionResponse.model_validate(t) for t in txns],
    )


@router.get("/{transaction_id}", response_model=ApiResponse[TransactionResponse])
def get_transaction(
    shop_id: uuid.UUID,
    transaction_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = transaction_service.get_transaction_by_id(db, current_user, shop_id, transaction_id)
    return ApiResponse(
        message="Transaction fetched",
        data=TransactionResponse.model_validate(tx),
    )


@router.get("/credit-sales/", response_model=ApiResponse[list[CreditSaleResponse]])
def get_credit_sales(
    shop_id: uuid.UUID,
    status: CreditStatus | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sales = transaction_service.get_credit_sales(db, current_user, shop_id, status)
    return ApiResponse(
        message="Credit sales fetched",
        data=[CreditSaleResponse.model_validate(s) for s in sales],
    )


@router.patch("/credit-sales/{credit_sale_id}", response_model=ApiResponse[CreditSaleResponse])
def update_credit_sale(
    shop_id: uuid.UUID,
    credit_sale_id: uuid.UUID,
    payload: CreditSaleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sale = transaction_service.update_credit_sale(db, current_user, shop_id, credit_sale_id, payload)
    return ApiResponse(
        message="Credit sale updated successfully",
        data=CreditSaleResponse.model_validate(sale),
    )
