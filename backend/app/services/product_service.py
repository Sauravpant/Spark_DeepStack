import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.product import Product
from app.models.shop import Shop
from app.models.user import User
from app.schemas.product import ProductCreateRequest, ProductUpdateRequest, StockAdjustRequest
from app.services.shop_service import get_shop_by_id


def _verify_shop_ownership(db: Session, user: User, shop_id: uuid.UUID) -> Shop:
    """Verify the user owns the shop. Returns the shop."""
    return get_shop_by_id(db, user, shop_id)


def create_product(db: Session, user: User, shop_id: uuid.UUID, payload: ProductCreateRequest) -> Product:
    _verify_shop_ownership(db, user, shop_id)
    # Check for duplicate SKU
    existing = db.query(Product).filter(Product.sku == payload.sku).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Product with SKU '{payload.sku}' already exists",
        )
    product = Product(
        shop_id=shop_id,
        category_id=payload.category_id,
        product_name=payload.product_name,
        sku=payload.sku,
        barcode=payload.barcode,
        unit=payload.unit,
        stock_quantity=payload.stock_quantity,
        cost_price=payload.cost_price,
        selling_price=payload.selling_price,
        reorder_level=payload.reorder_level,
        is_staple=payload.is_staple,
        is_perishable=payload.is_perishable,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def get_products(db: Session, user: User, shop_id: uuid.UUID) -> list[Product]:
    _verify_shop_ownership(db, user, shop_id)
    return db.query(Product).filter(Product.shop_id == shop_id, Product.is_active == True).all()


def get_product_by_id(db: Session, user: User, shop_id: uuid.UUID, product_id: uuid.UUID) -> Product:
    _verify_shop_ownership(db, user, shop_id)
    product = db.query(Product).filter(
        Product.id == product_id, Product.shop_id == shop_id
    ).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return product


def update_product(
    db: Session, user: User, shop_id: uuid.UUID, product_id: uuid.UUID, payload: ProductUpdateRequest
) -> Product:
    product = get_product_by_id(db, user, shop_id, product_id)
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, user: User, shop_id: uuid.UUID, product_id: uuid.UUID) -> None:
    product = get_product_by_id(db, user, shop_id, product_id)
    product.is_active = False  # Soft delete
    db.commit()


def stock_in(db: Session, user: User, shop_id: uuid.UUID, product_id: uuid.UUID, payload: StockAdjustRequest) -> Product:
    """Add stock to a product (inventory input)."""
    product = get_product_by_id(db, user, shop_id, product_id)
    if payload.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be positive",
        )
    product.stock_quantity += payload.quantity
    db.commit()
    db.refresh(product)
    return product


def stock_out(db: Session, user: User, shop_id: uuid.UUID, product_id: uuid.UUID, payload: StockAdjustRequest) -> Product:
    """Remove stock from a product (inventory output)."""
    product = get_product_by_id(db, user, shop_id, product_id)
    if payload.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be positive",
        )
    if product.stock_quantity < payload.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock. Available: {product.stock_quantity}",
        )
    product.stock_quantity -= payload.quantity
    db.commit()
    db.refresh(product)
    return product


def get_low_stock_products(db: Session, user: User, shop_id: uuid.UUID) -> list[Product]:
    """Get products where stock is at or below reorder level."""
    _verify_shop_ownership(db, user, shop_id)
    return (
        db.query(Product)
        .filter(
            Product.shop_id == shop_id,
            Product.is_active == True,
            Product.stock_quantity <= Product.reorder_level,
        )
        .all()
    )
