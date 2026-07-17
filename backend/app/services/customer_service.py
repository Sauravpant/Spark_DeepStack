import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.customer import Customer
from app.models.user import User
from app.schemas.customer import CustomerCreateRequest, CustomerUpdateRequest
from app.services.shop_service import get_shop_by_id


def create_customer(db: Session, user: User, shop_id: uuid.UUID, payload: CustomerCreateRequest) -> Customer:
    get_shop_by_id(db, user, shop_id)  # verify ownership
    customer = Customer(
        shop_id=shop_id,
        full_name=payload.full_name,
        phone=payload.phone,
        address=payload.address,
        credit_limit=payload.credit_limit,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def get_customers(db: Session, user: User, shop_id: uuid.UUID) -> list[Customer]:
    get_shop_by_id(db, user, shop_id)
    return db.query(Customer).filter(Customer.shop_id == shop_id, Customer.is_active == True).all()


def get_customer_by_id(db: Session, user: User, shop_id: uuid.UUID, customer_id: uuid.UUID) -> Customer:
    get_shop_by_id(db, user, shop_id)
    customer = db.query(Customer).filter(
        Customer.id == customer_id, Customer.shop_id == shop_id
    ).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )
    return customer


def update_customer(
    db: Session, user: User, shop_id: uuid.UUID, customer_id: uuid.UUID, payload: CustomerUpdateRequest
) -> Customer:
    customer = get_customer_by_id(db, user, shop_id, customer_id)
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(customer, key, value)
    db.commit()
    db.refresh(customer)
    return customer


def delete_customer(db: Session, user: User, shop_id: uuid.UUID, customer_id: uuid.UUID) -> None:
    customer = get_customer_by_id(db, user, shop_id, customer_id)
    customer.is_active = False  # Soft delete
    db.commit()
