"""
Demand Forecast API Router
==========================
Endpoints for demand forecasting using the trained CatBoost recursive forecaster.

Routes under two namespaces:
- /api/v1/ml/demand/...                           → Generic (supply raw inputs)
- /api/v1/shops/{shop_id}/demand/...              → Shop-level, product-based (DB-derived)
"""
from __future__ import annotations

import uuid
from typing import Any, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.response import ApiResponse
from app.schemas.demand_forecast import (
    DemandForecastRequest,
    DemandForecastByProductRequest,
    DemandForecastByProductBodyRequest,
    DailyForecastResponse,
    DailyForecastExplainResponse,
    DemandGlobalImportanceResponse,
)
import app.services.demand_forecast_service as demand_service

# ── Generic router ────────────────────────────────────────────────────────────
router_generic = APIRouter(prefix="/ml/demand", tags=["ML – Demand Forecasting"])

# ── Shop-level / product-based router ────────────────────────────────────────
router_shop = APIRouter(
    prefix="/shops/{shop_id}/demand",
    tags=["ML – Demand Forecasting (Shop/Product)"],
)


# ===========================================================================
# Generic endpoints — caller supplies all inputs (shop_id string, category,
# location_type, is_staple, is_perishable, last_date, histories)
# ===========================================================================

@router_generic.post("/predict-next-day", response_model=ApiResponse[DailyForecastResponse])
def predict_next_day(
    payload: DemandForecastRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Forecast demand for the next single day.
    Requires at least 21 days of daily sales history and transaction history.
    """
    result = demand_service.forecast_next_day(payload)
    return ApiResponse(message="Next day forecast generated", data=result)


@router_generic.post("/predict-next-7-days", response_model=ApiResponse[List[DailyForecastResponse]])
def predict_next_7_days(
    payload: DemandForecastRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Forecast demand for the next 7 days recursively.
    Each step feeds the previous prediction back as history for the next step.
    """
    results = demand_service.forecast_next_7_days(payload)
    return ApiResponse(message="7-day forecast generated", data=results)


@router_generic.post("/explain-next-day", response_model=ApiResponse[DailyForecastExplainResponse])
def explain_next_day(
    payload: DemandForecastRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Forecast the next day AND return SHAP-based explanation of which features
    (lag values, rolling averages, festival proximity, etc.) drove the forecast up or down.
    """
    result = demand_service.explain_next_day(payload)
    return ApiResponse(message="Next day forecast explanation generated", data=result)


@router_generic.post("/explain-next-7-days", response_model=ApiResponse[List[DailyForecastExplainResponse]])
def explain_next_7_days(
    payload: DemandForecastRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Forecast the next 7 days AND return SHAP explanations for each day.
    Useful for understanding which demand drivers change over the week.
    """
    results = demand_service.explain_next_7_days(payload)
    return ApiResponse(message="7-day forecast explanations generated", data=results)


@router_generic.get("/global-importance", response_model=ApiResponse[DemandGlobalImportanceResponse])
def global_feature_importance(
    current_user: User = Depends(get_current_user),
):
    """
    Return the global feature-importance table for the demand model
    (both native model importance and SHAP-based importance if available).
    """
    result = demand_service.get_global_feature_importance()
    return ApiResponse(message="Global feature importance fetched", data=result)


@router_generic.get("/model-info", response_model=ApiResponse[dict])
def model_metadata(
    current_user: User = Depends(get_current_user),
):
    """Return training metadata: model name, version, test R², RMSE, MAE, etc."""
    result = demand_service.get_model_metadata()
    return ApiResponse(message="Model metadata fetched", data=result)


# ===========================================================================
# Shop / product-based endpoints — metadata resolved from DB
# ===========================================================================

@router_shop.post("/products/{product_id}/predict-next-day", response_model=ApiResponse[dict])
def predict_next_day_for_product(
    shop_id: uuid.UUID,
    product_id: uuid.UUID,
    payload: DemandForecastByProductBodyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Forecast next-day demand for a specific product in this shop.
    Category, is_staple, is_perishable are looked up from the product record.
    The shop's location_type is resolved from the shop record.
    You only need to supply last_date and the sales/transactions history arrays.
    """
    # Inject the path product_id into the full payload
    full_payload = DemandForecastByProductRequest(
        product_id=product_id,
        last_date=payload.last_date,
        sales_history=payload.sales_history,
        transactions_history=payload.transactions_history,
    )
    result = demand_service.forecast_next_day_for_product(db, shop_id, full_payload)
    return ApiResponse(message="Product next-day demand forecast generated", data=result)


@router_shop.post("/products/{product_id}/predict-next-7-days", response_model=ApiResponse[List[dict]])
def predict_next_7_days_for_product(
    shop_id: uuid.UUID,
    product_id: uuid.UUID,
    payload: DemandForecastByProductBodyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Forecast 7-day demand for a specific product in this shop.
    Category, is_staple, is_perishable are looked up from the product record.
    """
    full_payload = DemandForecastByProductRequest(
        product_id=product_id,
        last_date=payload.last_date,
        sales_history=payload.sales_history,
        transactions_history=payload.transactions_history,
    )
    result = demand_service.forecast_next_7_days_for_product(db, shop_id, full_payload)
    return ApiResponse(message="Product 7-day demand forecast generated", data=result)
