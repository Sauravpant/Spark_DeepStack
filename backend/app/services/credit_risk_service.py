"""
Credit Risk Service
===================
Business logic for computing credit-risk features from the database and
delegating to the CreditRiskPredictor ML model.

Two modes are supported:
1. **Direct / manual** – caller supplies all 18 features in the request body.
2. **Customer-derived** – service computes the 18 features automatically from
   the customer's transaction + credit-sale history stored in the DB.
"""
from __future__ import annotations

import logging
import uuid
from datetime import date, datetime, timezone, timedelta
from typing import Any, Dict, Optional

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.ml_manager import get_credit_risk_predictor
from app.models.customer import Customer
from app.models.credit_sale import CreditSale
from app.models.transaction import Transaction
from app.models.enums import CreditStatus, PaymentType, RiskLevel
from app.models.credit_prediction import CreditPrediction
from app.schemas.credit_risk import CreditRiskPredictRequest

logger = logging.getLogger(__name__)

DAYS_WINDOW = 30  # look-back window for "last 30 days" features


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_predictor():
    predictor = get_credit_risk_predictor()
    if predictor is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Credit risk model is not loaded. Contact the system administrator.",
        )
    return predictor


def _get_customer_or_404(db: Session, shop_id: uuid.UUID, customer_id: uuid.UUID) -> Customer:
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.shop_id == shop_id,
        Customer.is_active == True,
    ).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer {customer_id} not found in shop {shop_id}",
        )
    return customer


def _compute_features_from_db(db: Session, customer: Customer) -> Dict[str, Any]:
    """
    Derive the 18 credit-risk feature values from the customer's DB history.
    This mirrors the feature definitions in ml/credit_risk/src/config.py.
    """
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    cutoff_30d = now - timedelta(days=DAYS_WINDOW)
    customer_id = customer.id

    # ---- relationship_days ------------------------------------------------
    relationship_days = max(0, (now - customer.created_at).days)

    # ---- All customer transactions -----------------------------------------
    all_txns = (
        db.query(Transaction)
        .filter(Transaction.customer_id == customer_id)
        .all()
    )
    # Last 30 days transactions
    recent_txns = [t for t in all_txns if t.created_at >= cutoff_30d]

    # ---- transaction counts & values (last 30d) ----------------------------
    transaction_count_last_30d = len(recent_txns)

    cash_purchase_value_last_30d = sum(
        float(t.total_amount) for t in recent_txns if t.payment_type != PaymentType.CREDIT
    )
    credit_purchase_value_last_30d = sum(
        float(t.total_amount) for t in recent_txns if t.payment_type == PaymentType.CREDIT
    )
    credit_transaction_count_last_30d = sum(
        1 for t in recent_txns if t.payment_type == PaymentType.CREDIT
    )

    # ---- averages ----------------------------------------------------------
    all_amounts = [float(t.total_amount) for t in all_txns] if all_txns else [0.0]
    avg_purchase_amount = sum(all_amounts) / len(all_amounts) if all_amounts else 0.0

    credit_amounts = [float(t.total_amount) for t in all_txns if t.payment_type == PaymentType.CREDIT]
    avg_credit_transaction_amount = (sum(credit_amounts) / len(credit_amounts)) if credit_amounts else 0.0

    # ---- credit to purchase ratio -----------------------------------------
    total_value_30d = cash_purchase_value_last_30d + credit_purchase_value_last_30d
    credit_to_purchase_ratio = (
        credit_purchase_value_last_30d / total_value_30d if total_value_30d > 0 else 0.0
    )

    # ---- outstanding & max outstanding ------------------------------------
    current_outstanding_balance = float(customer.current_outstanding_balance)
    max_outstanding_ever = float(customer.max_outstanding_ever)

    outstanding_to_avg_transaction_ratio = (
        current_outstanding_balance / avg_purchase_amount if avg_purchase_amount > 0 else 0.0
    )

    # ---- credit sale repayment features ------------------------------------
    credit_sales = (
        db.query(CreditSale)
        .filter(CreditSale.customer_id == customer_id)
        .all()
    )
    completed = [cs for cs in credit_sales if cs.status == CreditStatus.PAID]
    num_completed_credit_cycles = len(completed)

    # pct_repaid_on_time: fraction of completed cycles paid by due_date
    on_time = [
        cs for cs in completed
        if cs.paid_at is not None and cs.paid_at.date() <= cs.due_date
    ]
    pct_repaid_on_time = len(on_time) / num_completed_credit_cycles if num_completed_credit_cycles > 0 else 0.0

    # avg_days_to_repay
    days_to_repay_list = []
    for cs in completed:
        if cs.paid_at is not None:
            created = cs.created_at
            paid = cs.paid_at
            days_to_repay_list.append(max(0, (paid - created).days))
    avg_days_to_repay = (sum(days_to_repay_list) / len(days_to_repay_list)) if days_to_repay_list else 0.0

    # repayment_consistency: std-dev of days to repay (lower = more consistent)
    if len(days_to_repay_list) >= 2:
        mean_d = avg_days_to_repay
        variance = sum((d - mean_d) ** 2 for d in days_to_repay_list) / len(days_to_repay_list)
        repayment_consistency = variance ** 0.5
    else:
        repayment_consistency = 0.0

    # historical_repayment_ratio: total paid / total credit taken
    total_credit_ever = sum(float(cs.credit_amount) for cs in credit_sales) if credit_sales else 0.0
    total_repaid = sum(float(cs.credit_amount) for cs in completed)
    historical_repayment_ratio = (total_repaid / total_credit_ever) if total_credit_ever > 0 else 0.0

    # num_severely_late_repayments: completed but > 30 days past due
    severely_late = [
        cs for cs in completed
        if cs.paid_at is not None and cs.paid_at.date() > cs.due_date + timedelta(days=30)
    ]
    num_severely_late_repayments = len(severely_late)

    # ---- days since last purchase -----------------------------------------
    if all_txns:
        last_purchase_date = max(t.created_at for t in all_txns)
        days_since_last_purchase = max(0, (now - last_purchase_date).days)
    else:
        days_since_last_purchase = relationship_days  # never bought

    return {
        "relationship_days": relationship_days,
        "cash_purchase_value_last_30d": cash_purchase_value_last_30d,
        "credit_purchase_value_last_30d": credit_purchase_value_last_30d,
        "transaction_count_last_30d": transaction_count_last_30d,
        "credit_transaction_count_last_30d": credit_transaction_count_last_30d,
        "avg_purchase_amount": avg_purchase_amount,
        "avg_credit_transaction_amount": avg_credit_transaction_amount,
        "credit_to_purchase_ratio": credit_to_purchase_ratio,
        "current_outstanding_balance": current_outstanding_balance,
        "outstanding_to_avg_transaction_ratio": outstanding_to_avg_transaction_ratio,
        "pct_repaid_on_time": pct_repaid_on_time,
        "avg_days_to_repay": avg_days_to_repay,
        "repayment_consistency": repayment_consistency,
        "historical_repayment_ratio": historical_repayment_ratio,
        "num_completed_credit_cycles": num_completed_credit_cycles,
        "num_severely_late_repayments": num_severely_late_repayments,
        "max_outstanding_ever": max_outstanding_ever,
        "days_since_last_purchase": days_since_last_purchase,
    }


def _risk_level(probability: float) -> RiskLevel:
    if probability >= 0.65:
        return RiskLevel.HIGH
    elif probability >= 0.35:
        return RiskLevel.MEDIUM
    return RiskLevel.LOW


# ---------------------------------------------------------------------------
# Public service functions
# ---------------------------------------------------------------------------

def predict_direct(payload: CreditRiskPredictRequest) -> Dict[str, Any]:
    """Run prediction from caller-supplied feature values."""
    predictor = _get_predictor()
    try:
        result = predictor.predict(**payload.model_dump())
    except Exception as exc:
        logger.exception("Credit risk prediction failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Prediction error: {exc}",
        )
    return result


def predict_probability_direct(payload: CreditRiskPredictRequest) -> Dict[str, Any]:
    """Return only the calibrated risk probability from caller-supplied features."""
    predictor = _get_predictor()
    try:
        result = predictor.predict_probability(**payload.model_dump())
    except Exception as exc:
        logger.exception("Credit risk probability prediction failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Prediction error: {exc}",
        )
    return result


def explain_direct(payload: CreditRiskPredictRequest, top_k: int = 5) -> Dict[str, Any]:
    """Return prediction + SHAP explanation from caller-supplied features."""
    predictor = _get_predictor()
    try:
        result = predictor.explain_prediction(top_k=top_k, **payload.model_dump())
    except Exception as exc:
        logger.exception("Credit risk explanation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Explanation error: {exc}",
        )
    return result


def predict_for_customer(
    db: Session,
    shop_id: uuid.UUID,
    customer_id: uuid.UUID,
    save_result: bool = True,
) -> Dict[str, Any]:
    """
    Auto-compute features from DB and predict risk for a specific customer.
    Optionally persists the prediction result to the credit_predictions table.
    """
    predictor = _get_predictor()
    customer = _get_customer_or_404(db, shop_id, customer_id)
    features = _compute_features_from_db(db, customer)

    try:
        result = predictor.predict(**features)
    except Exception as exc:
        logger.exception("Credit risk prediction for customer %s failed: %s", customer_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction error: {exc}",
        )

    # Persist to DB
    if save_result:
        risk_lvl = _risk_level(result["risk_probability"])
        # Recommend credit limit: basic rule — if high risk, cap at 20% of current limit
        # else keep current or bump by 10%
        existing_limit = float(customer.credit_limit)
        if result["is_risk"]:
            recommended_limit = round(existing_limit * 0.5, 2)
        else:
            recommended_limit = round(existing_limit * 1.1, 2)

        model_version = str(result.get("model", "unknown"))
        record = CreditPrediction(
            customer_id=customer_id,
            risk_probability=result["risk_probability"],
            risk_level=risk_lvl,
            recommended_credit_limit=recommended_limit,
            model_version=model_version,
        )
        db.add(record)
        db.commit()

    result["computed_features"] = features
    result["customer_id"] = str(customer_id)
    return result


def explain_for_customer(
    db: Session,
    shop_id: uuid.UUID,
    customer_id: uuid.UUID,
    top_k: int = 5,
) -> Dict[str, Any]:
    """Auto-compute features from DB and return SHAP explanation for a customer."""
    predictor = _get_predictor()
    customer = _get_customer_or_404(db, shop_id, customer_id)
    features = _compute_features_from_db(db, customer)

    try:
        result = predictor.explain_prediction(top_k=top_k, **features)
    except Exception as exc:
        logger.exception("Credit risk explanation for customer %s failed: %s", customer_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Explanation error: {exc}",
        )

    result["computed_features"] = features
    result["customer_id"] = str(customer_id)
    return result


def get_global_feature_importance() -> Dict[str, Any]:
    predictor = _get_predictor()
    return predictor.get_global_feature_importance()


def get_model_metadata() -> Dict[str, Any]:
    predictor = _get_predictor()
    return predictor.get_model_metadata()
