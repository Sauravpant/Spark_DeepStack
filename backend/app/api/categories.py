import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.category import CategoryCreateRequest, CategoryUpdateRequest, CategoryResponse
from app.schemas.response import ApiResponse
import app.services.category_service as category_service
router = APIRouter(prefix="/categories", tags=["Categories"])


@router.post("/", response_model=ApiResponse[CategoryResponse], status_code=201)
def create_category(
    payload: CategoryCreateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    category = category_service.create_category(db, payload)
    return ApiResponse(
        message="Category created successfully",
        data=CategoryResponse.model_validate(category),
    )


@router.get("/", response_model=ApiResponse[list[CategoryResponse]])
def get_categories(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    categories = category_service.get_all_categories(db)
    return ApiResponse(
        message="Categories fetched",
        data=[CategoryResponse.model_validate(c) for c in categories],
    )


@router.get("/{category_id}", response_model=ApiResponse[CategoryResponse])
def get_category(
    category_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    category = category_service.get_category_by_id(db, category_id)
    return ApiResponse(
        message="Category fetched",
        data=CategoryResponse.model_validate(category),
    )


@router.patch("/{category_id}", response_model=ApiResponse[CategoryResponse])
def update_category(
    category_id: uuid.UUID,
    payload: CategoryUpdateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    category = category_service.update_category(db, category_id, payload)
    return ApiResponse(
        message="Category updated successfully",
        data=CategoryResponse.model_validate(category),
    )


@router.delete("/{category_id}", response_model=ApiResponse)
def delete_category(
    category_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    category_service.delete_category(db, category_id)
    return ApiResponse(message="Category deleted successfully")
