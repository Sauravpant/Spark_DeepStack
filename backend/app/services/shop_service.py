import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.shop import Shop
from app.models.user import User
from app.schemas.shop import ShopCreateRequest, ShopUpdateRequest


def create_shop(db: Session, user: User, payload: ShopCreateRequest) -> Shop:
    shop = Shop(
        user_id=user.id,
        shop_name=payload.shop_name,
        address=payload.address,
        location_type=payload.location_type,
    )
    db.add(shop)
    db.commit()
    db.refresh(shop)
    return shop


def get_user_shops(db: Session, user: User) -> list[Shop]:
    return db.query(Shop).filter(Shop.user_id == user.id).all()


def get_shop_by_id(db: Session, user: User, shop_id: uuid.UUID) -> Shop:
    shop = db.query(Shop).filter(Shop.id == shop_id, Shop.user_id == user.id).first()
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found",
        )
    return shop


def update_shop(db: Session, user: User, shop_id: uuid.UUID, payload: ShopUpdateRequest) -> Shop:
    shop = get_shop_by_id(db, user, shop_id)
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(shop, key, value)
    db.commit()
    db.refresh(shop)
    return shop


def delete_shop(db: Session, user: User, shop_id: uuid.UUID) -> None:
    shop = get_shop_by_id(db, user, shop_id)
    db.delete(shop)
    db.commit()
