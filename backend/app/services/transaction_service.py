import uuid
from datetime import date, datetime, timezone
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.transaction import Transaction
from app.models.transaction_item import TransactionItem
from app.models.credit_sale import CreditSale
from app.models.product import Product
from app.models.customer import Customer
from app.models.user import User
from app.models.enums import PaymentType, CreditStatus, TransactionType
from app.schemas.transaction import TransactionCreateRequest, CreditSaleUpdateRequest
from app.services.shop_service import get_shop_by_id


def create_transaction(
    db: Session, user: User, shop_id: uuid.UUID, payload: TransactionCreateRequest
) -> Transaction:
    get_shop_by_id(db, user, shop_id)

    if not payload.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction must have at least one item",
        )

    # Credit sales require a customer and due date
    if payload.transaction_type == TransactionType.SALE and payload.payment_type == PaymentType.CREDIT:
        if not payload.customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Credit sales require a customer",
            )
        if not payload.due_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Credit sales require a due date",
            )

    # Build transaction items and calculate subtotal
    subtotal = 0.0
    tx_items = []
    for item_req in payload.items:
        product = db.query(Product).filter(
            Product.id == item_req.product_id, Product.shop_id == shop_id
        ).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item_req.product_id} not found in this shop",
            )
        if payload.transaction_type == TransactionType.SALE and product.stock_quantity < item_req.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for '{product.product_name}'. Available: {product.stock_quantity}",
            )
        unit_price = float(product.selling_price)
        if payload.transaction_type == TransactionType.PURCHASE:
            unit_price = float(product.cost_price)
        item_subtotal = unit_price * item_req.quantity
        tx_items.append(TransactionItem(
            product_id=product.id,
            quantity=item_req.quantity,
            unit_price=unit_price,
            subtotal=item_subtotal,
        ))
        # Update stock based on transaction direction
        if payload.transaction_type == TransactionType.SALE:
            product.stock_quantity -= item_req.quantity
        else:
            product.stock_quantity += item_req.quantity
        subtotal += item_subtotal

    total_amount = subtotal - payload.discount

    transaction = Transaction(
        shop_id=shop_id,
        customer_id=payload.customer_id,
        transaction_type=payload.transaction_type,
        payment_type=payload.payment_type,
        subtotal=subtotal,
        discount=payload.discount,
        total_amount=total_amount,
        notes=payload.notes,
        items=tx_items,
    )
    db.add(transaction)
    db.flush()  # Get the transaction ID

    # Create credit sale record only for sales paid on credit
    if payload.transaction_type == TransactionType.SALE and payload.payment_type == PaymentType.CREDIT:
        credit_sale = CreditSale(
            transaction_id=transaction.id,
            customer_id=payload.customer_id,
            credit_amount=total_amount,
            due_date=payload.due_date,
            status=CreditStatus.UNPAID,
        )
        db.add(credit_sale)

        # Update customer outstanding balance
        customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
        if customer:
            customer.current_outstanding_balance = float(customer.current_outstanding_balance) + total_amount
            if float(customer.current_outstanding_balance) > float(customer.max_outstanding_ever):
                customer.max_outstanding_ever = customer.current_outstanding_balance

    db.commit()
    db.refresh(transaction)
    return transaction


def get_transactions(db: Session, user: User, shop_id: uuid.UUID) -> list[Transaction]:
    get_shop_by_id(db, user, shop_id)
    return (
        db.query(Transaction)
        .options(joinedload(Transaction.items), joinedload(Transaction.credit_sale))
        .filter(Transaction.shop_id == shop_id)
        .order_by(Transaction.created_at.desc())
        .all()
    )


def get_transaction_by_id(
    db: Session, user: User, shop_id: uuid.UUID, transaction_id: uuid.UUID
) -> Transaction:
    get_shop_by_id(db, user, shop_id)
    transaction = (
        db.query(Transaction)
        .options(joinedload(Transaction.items), joinedload(Transaction.credit_sale))
        .filter(Transaction.id == transaction_id, Transaction.shop_id == shop_id)
        .first()
    )
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )
    return transaction


def get_credit_sales(db: Session, user: User, shop_id: uuid.UUID, status_filter: CreditStatus | None = None) -> list[CreditSale]:
    get_shop_by_id(db, user, shop_id)
    query = (
        db.query(CreditSale)
        .join(Transaction, CreditSale.transaction_id == Transaction.id)
        .filter(Transaction.shop_id == shop_id)
    )
    if status_filter:
        query = query.filter(CreditSale.status == status_filter)
    return query.order_by(CreditSale.created_at.desc()).all()


def update_credit_sale(
    db: Session, user: User, shop_id: uuid.UUID, credit_sale_id: uuid.UUID, payload: CreditSaleUpdateRequest
) -> CreditSale:
    get_shop_by_id(db, user, shop_id)
    credit_sale = (
        db.query(CreditSale)
        .join(Transaction, CreditSale.transaction_id == Transaction.id)
        .filter(CreditSale.id == credit_sale_id, Transaction.shop_id == shop_id)
        .first()
    )
    if not credit_sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credit sale not found",
        )

    if payload.status and payload.status == CreditStatus.PAID and credit_sale.status != CreditStatus.PAID:
        credit_sale.status = CreditStatus.PAID
        credit_sale.paid_at = datetime.now(timezone.utc)
        # Update customer outstanding balance
        customer = db.query(Customer).filter(Customer.id == credit_sale.customer_id).first()
        if customer:
            customer.current_outstanding_balance = (
                float(customer.current_outstanding_balance) - float(credit_sale.credit_amount)
            )
            if float(customer.current_outstanding_balance) < 0:
                customer.current_outstanding_balance = 0
    elif payload.status:
        credit_sale.status = payload.status

    if payload.remarks is not None:
        credit_sale.remarks = payload.remarks

    db.commit()
    db.refresh(credit_sale)
    return credit_sale
