import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.category import Category
from app.schemas.category import CategoryCreateRequest, CategoryUpdateRequest


def create_category(db: Session, payload: CategoryCreateRequest) -> Category:
    existing = db.query(Category).filter(Category.name == payload.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category already exists",
        )
    category = Category(
        name=payload.name,
        description=payload.description,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def get_all_categories(db: Session) -> list[Category]:
    return db.query(Category).all()


def get_category_by_id(db: Session, category_id: uuid.UUID) -> Category:
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )
    return category


def update_category(db: Session, category_id: uuid.UUID, payload: CategoryUpdateRequest) -> Category:
    category = get_category_by_id(db, category_id)
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(category, key, value)
    db.commit()
    db.refresh(category)
    return category


def delete_category(db: Session, category_id: uuid.UUID) -> None:
    category = get_category_by_id(db, category_id)
    db.delete(category)
    db.commit()
