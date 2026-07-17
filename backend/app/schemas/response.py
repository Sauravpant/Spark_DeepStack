from typing import Any, Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """Standard API response wrapper."""
    success: bool = True
    message: str = "Success"
    data: T | None = None


class ErrorResponse(BaseModel):
    """Standard error response."""
    success: bool = False
    message: str
    detail: str | None = None


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper."""
    success: bool = True
    message: str = "Success"
    data: list[T] = []
    total: int = 0
    page: int = 1
    page_size: int = 20
    total_pages: int = 0
