import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr


# ---- Request Schemas ----

class UserRegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: str | None = None


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


# ---- Response Schemas ----

class UserResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    phone: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginResponse(BaseModel):
    user: UserResponse
    token: TokenResponse
