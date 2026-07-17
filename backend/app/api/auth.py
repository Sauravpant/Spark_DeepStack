from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, UserResponse, LoginResponse
from app.schemas.response import ApiResponse
import app.services.auth_service as auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=ApiResponse[UserResponse], status_code=201)
def register(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    user = auth_service.register_user(db, payload)
    return ApiResponse(
        message="User registered successfully",
        data=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=ApiResponse[LoginResponse])
def login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    result = auth_service.login_user(db, payload)
    return ApiResponse(
        message="Login successful",
        data=result,
    )


@router.get("/me", response_model=ApiResponse[UserResponse])
def get_me(current_user: User = Depends(get_current_user)):
    user = auth_service.get_user_profile(current_user)
    return ApiResponse(
        message="User profile fetched",
        data=UserResponse.model_validate(user),
    )


@router.post("/logout", response_model=ApiResponse)
def logout():
    """Client-side logout — just return success. Token invalidation is handled client-side."""
    return ApiResponse(message="Logged out successfully")
