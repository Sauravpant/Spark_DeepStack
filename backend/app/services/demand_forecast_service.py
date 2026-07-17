"""
Demand Forecast Service
=======================
Business logic for generating demand forecasts using the DemandForecaster model.

Two modes are supported:
1. **Direct / manual** – caller supplies shop_id string, category, location_type,
   is_staple, is_perishable, last_date, and sales/transaction history arrays.
2. **Product-based** – caller supplies a product_id and the service looks up
   category, is_staple, is_perishable from the product, and location_type
   from the shop record, then runs the forecast.
"""
from __future__ import annotations

import logging
import uuid
from datetime import date, datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.ml_manager import get_demand_forecaster
from app.models.product import Product
from app.models.shop import Shop
from app.models.transaction import Transaction
from app.models.transaction_item import TransactionItem
from app.models.category import Category
from app.models.demand_forecast import DemandForecast
from app.models.enums import TransactionType
from app.schemas.demand_forecast import DemandForecastRequest, DemandForecastByProductRequest

logger = logging.getLogger(__name__)

MIN_HISTORY_DAYS = 21  # must match ml/demand/src/utils.py


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_forecaster():
    forecaster = get_demand_forecaster()
    if forecaster is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Demand forecasting model is not loaded. Contact the system administrator.",
        )
    return forecaster


def _get_product_or_404(db: Session, shop_id: uuid.UUID, product_id: uuid.UUID) -> Product:
    product = (
        db.query(Product)
        .filter(
            Product.id == product_id,
            Product.shop_id == shop_id,
            Product.is_active == True,
        )
        .first()
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product {product_id} not found in shop {shop_id}",
        )
    return product


def _get_shop_or_404(db: Session, shop_id: uuid.UUID) -> Shop:
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shop {shop_id} not found",
        )
    return shop


def _build_product_sales_history(
    db: Session, shop_id: uuid.UUID, product_id: uuid.UUID, last_date_str: str, num_days: int
) -> tuple[List[float], List[int], str]:
    """
    Build sales_history and transactions_history for a specific product
    by aggregating transaction items grouped by date over the last `num_days` days.
    Returns (sales_history, transactions_history, last_date_str).
    """
    last_date = datetime.strptime(last_date_str, "%Y-%m-%d").date()
    start_date = last_date - timedelta(days=num_days - 1)

    # Get all transaction items for this product in the date range
    results = (
        db.query(
            Transaction.created_at,
            TransactionItem.quantity,
        )
        .join(TransactionItem, TransactionItem.transaction_id == Transaction.id)
        .filter(
            Transaction.shop_id == shop_id,
            Transaction.transaction_type == TransactionType.SALE,
            TransactionItem.product_id == product_id,
            Transaction.created_at >= datetime.combine(start_date, datetime.min.time()),
            Transaction.created_at <= datetime.combine(last_date, datetime.max.time()),
        )
        .all()
    )

    # Aggregate by date
    daily_sales: Dict[date, float] = {}
    daily_txns: Dict[date, int] = {}
    for row in results:
        d = row.created_at.date()
        daily_sales[d] = daily_sales.get(d, 0.0) + float(row.quantity)
        daily_txns[d] = daily_txns.get(d, 0) + 1

    # Build contiguous arrays from start_date to last_date
    sales_history = []
    transactions_history = []
    current = start_date
    while current <= last_date:
        sales_history.append(daily_sales.get(current, 0.0))
        transactions_history.append(daily_txns.get(current, 0))
        current += timedelta(days=1)

    return sales_history, transactions_history, last_date_str


# ---------------------------------------------------------------------------
# Public service functions - Direct (manual inputs)
# ---------------------------------------------------------------------------

def forecast_next_day(payload: DemandForecastRequest) -> Dict[str, Any]:
    forecaster = _get_forecaster()
    try:
        result = forecaster.predict_next_day(
            shop_id=payload.shop_id,
            category=payload.category,
            location_type=payload.location_type,
            is_staple=payload.is_staple,
            is_perishable=payload.is_perishable,
            last_date=payload.last_date,
            sales_history=payload.sales_history,
            transactions_history=payload.transactions_history,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        logger.exception("Demand forecast (next day) failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecast error: {exc}",
        )
    return result


def forecast_next_7_days(payload: DemandForecastRequest) -> List[Dict[str, Any]]:
    forecaster = _get_forecaster()
    try:
        results = forecaster.predict_next_7_days(
            shop_id=payload.shop_id,
            category=payload.category,
            location_type=payload.location_type,
            is_staple=payload.is_staple,
            is_perishable=payload.is_perishable,
            last_date=payload.last_date,
            sales_history=payload.sales_history,
            transactions_history=payload.transactions_history,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        logger.exception("Demand forecast (7 days) failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecast error: {exc}",
        )
    return results


def explain_next_day(payload: DemandForecastRequest) -> Dict[str, Any]:
    forecaster = _get_forecaster()
    try:
        result = forecaster.explain_next_day(
            shop_id=payload.shop_id,
            category=payload.category,
            location_type=payload.location_type,
            is_staple=payload.is_staple,
            is_perishable=payload.is_perishable,
            last_date=payload.last_date,
            sales_history=payload.sales_history,
            transactions_history=payload.transactions_history,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        logger.exception("Demand explain (next day) failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Explanation error: {exc}",
        )
    return result


def explain_next_7_days(payload: DemandForecastRequest) -> List[Dict[str, Any]]:
    forecaster = _get_forecaster()
    try:
        results = forecaster.explain_next_7_days(
            shop_id=payload.shop_id,
            category=payload.category,
            location_type=payload.location_type,
            is_staple=payload.is_staple,
            is_perishable=payload.is_perishable,
            last_date=payload.last_date,
            sales_history=payload.sales_history,
            transactions_history=payload.transactions_history,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        logger.exception("Demand explain (7 days) failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Explanation error: {exc}",
        )
    return results


# ---------------------------------------------------------------------------
# Public service functions - Product-based (DB-derived inputs)
# ---------------------------------------------------------------------------

def forecast_next_day_for_product(
    db: Session,
    shop_id: uuid.UUID,
    payload: DemandForecastByProductRequest,
) -> Dict[str, Any]:
    """Forecast next day for a specific product, using its DB metadata."""
    forecaster = _get_forecaster()
    shop = _get_shop_or_404(db, shop_id)
    product = _get_product_or_404(db, shop_id, payload.product_id)
    category = db.query(Category).filter(Category.id == product.category_id).first()
    category_name = category.name if category else "unknown"

    sales_hist = payload.sales_history
    tx_hist = payload.transactions_history
    if sales_hist is None or tx_hist is None:
        sales_hist, tx_hist, _ = _build_product_sales_history(
            db, shop_id, payload.product_id, payload.last_date, num_days=21
        )

    try:
        result = forecaster.predict_next_day(
            shop_id=str(shop_id),
            category=category_name,
            location_type=shop.location_type.value,
            is_staple=int(product.is_staple),
            is_perishable=int(product.is_perishable),
            last_date=payload.last_date,
            sales_history=sales_hist,
            transactions_history=tx_hist,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        logger.exception("Product demand forecast (next day) failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecast error: {exc}",
        )

    result["product_id"] = str(payload.product_id)
    result["category"] = category_name
    result["location_type"] = shop.location_type.value

    # Save to database
    try:
        f_date = datetime.strptime(result["forecast_date"], "%Y-%m-%d").date()
        forecast_record = DemandForecast(
            shop_id=shop_id,
            product_id=payload.product_id,
            forecast_date=f_date,
            predicted_quantity=round(result["predicted_units"]),
            confidence_score=result["confidence"],
            model_version=result["model"]
        )
        db.add(forecast_record)
        db.commit()
    except Exception as db_exc:
        db.rollback()
        logger.error("Failed to save demand forecast to DB: %s", db_exc)

    return result


def forecast_next_7_days_for_product(
    db: Session,
    shop_id: uuid.UUID,
    payload: DemandForecastByProductRequest,
) -> List[Dict[str, Any]]:
    """Forecast next 7 days for a specific product, using its DB metadata."""
    forecaster = _get_forecaster()
    shop = _get_shop_or_404(db, shop_id)
    product = _get_product_or_404(db, shop_id, payload.product_id)
    category = db.query(Category).filter(Category.id == product.category_id).first()
    category_name = category.name if category else "unknown"

    sales_hist = payload.sales_history
    tx_hist = payload.transactions_history
    if sales_hist is None or tx_hist is None:
        sales_hist, tx_hist, _ = _build_product_sales_history(
            db, shop_id, payload.product_id, payload.last_date, num_days=21
        )

    try:
        results = forecaster.predict_next_7_days(
            shop_id=str(shop_id),
            category=category_name,
            location_type=shop.location_type.value,
            is_staple=int(product.is_staple),
            is_perishable=int(product.is_perishable),
            last_date=payload.last_date,
            sales_history=sales_hist,
            transactions_history=tx_hist,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        logger.exception("Product demand forecast (7 days) failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecast error: {exc}",
        )

    product_id_str = str(payload.product_id)
    for r in results:
        r["product_id"] = product_id_str
        r["category"] = category_name

    # Save to database
    try:
        for r in results:
            f_date = datetime.strptime(r["forecast_date"], "%Y-%m-%d").date()
            forecast_record = DemandForecast(
                shop_id=shop_id,
                product_id=payload.product_id,
                forecast_date=f_date,
                predicted_quantity=round(r["predicted_units"]),
                confidence_score=r["confidence"],
                model_version=r["model"]
            )
            db.add(forecast_record)
        db.commit()
    except Exception as db_exc:
        db.rollback()
        logger.error("Failed to save 7-day demand forecasts to DB: %s", db_exc)

    return results


# ---------------------------------------------------------------------------
# Global model info
# ---------------------------------------------------------------------------

def get_global_feature_importance() -> Dict[str, Any]:
    forecaster = _get_forecaster()
    return forecaster.get_global_feature_importance()


def get_model_metadata() -> Dict[str, Any]:
    forecaster = _get_forecaster()
    return forecaster.get_model_metadata()
