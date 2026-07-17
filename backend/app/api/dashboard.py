import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.dashboard import DashboardDetail
from app.schemas.response import ApiResponse
import app.services.dashboard_service as dashboard_service
router = APIRouter(prefix="/shops/{shop_id}/dashboard", tags=["Dashboard"])


@router.get("/", response_model=ApiResponse[DashboardDetail])
def get_dashboard(
    shop_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = dashboard_service.get_dashboard(db, current_user, shop_id)
    return ApiResponse(
        message="Dashboard data fetched",
        data=data,
    )
