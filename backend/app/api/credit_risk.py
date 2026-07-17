"""
Credit Risk API Router
======================
Endpoints for credit risk prediction using the trained CatBoost + calibrator pipeline.

Routes under two namespaces:
- /api/v1/ml/credit-risk/...  →  Generic / direct prediction (supply raw features)
- /api/v1/shops/{shop_id}/customers/{customer_id}/credit-risk/...  →  Per-customer (DB-derived features)
"""
from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.response import ApiResponse
from app.schemas.credit_risk import (
    CreditRiskPredictRequest,
    CreditRiskPredictResponse,
    CreditRiskExplainResponse,
    CreditRiskGlobalImportanceResponse,
    CreditRiskModelMetadataResponse,
)
import app.services.credit_risk_service as credit_risk_service

# ── Generic router (no shop_id / customer_id in path) ────────────────────────
router_generic = APIRouter(prefix="/ml/credit-risk", tags=["ML – Credit Risk"])

# ── Per-customer router ───────────────────────────────────────────────────────
router_customer = APIRouter(
    prefix="/shops/{shop_id}/customers/{customer_id}/credit-risk",
    tags=["ML – Credit Risk (Customer)"],
)


# ===========================================================================
# Generic endpoints — caller supplies all 18 features directly
# ===========================================================================

@router_generic.post("/predict", response_model=ApiResponse[CreditRiskPredictResponse])
def predict_direct(
    payload: CreditRiskPredictRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Predict credit risk from manually supplied feature values.
    Returns: binary prediction (0/1), calibrated probability, threshold, model name.
    """
    result = credit_risk_service.predict_direct(payload)
    return ApiResponse(message="Credit risk prediction successful", data=result)


@router_generic.post("/predict-probability", response_model=ApiResponse[dict])
def predict_probability_direct(
    payload: CreditRiskPredictRequest,
    current_user: User = Depends(get_current_user),
):
    """Return only the calibrated risk probability (0.0 – 1.0) for the supplied features."""
    result = credit_risk_service.predict_probability_direct(payload)
    return ApiResponse(message="Risk probability computed", data=result)


@router_generic.post("/explain", response_model=ApiResponse[CreditRiskExplainResponse])
def explain_direct(
    payload: CreditRiskPredictRequest,
    top_k: int = Query(5, ge=1, le=18, description="Number of top positive/negative SHAP drivers to return"),
    current_user: User = Depends(get_current_user),
):
    """
    Predict credit risk AND return a SHAP-based explanation of which features
    drove the decision (both pushing risk up and down).
    """
    result = credit_risk_service.explain_direct(payload, top_k=top_k)
    return ApiResponse(message="Credit risk explanation generated", data=result)


@router_generic.get("/global-importance", response_model=ApiResponse[CreditRiskGlobalImportanceResponse])
def global_feature_importance(
    current_user: User = Depends(get_current_user),
):
    """
    Return the ranked global feature-importance table computed at training time
    (mean absolute SHAP values over the training set).
    """
    result = credit_risk_service.get_global_feature_importance()
    return ApiResponse(message="Global feature importance fetched", data=result)


@router_generic.get("/model-info", response_model=ApiResponse[dict])
def model_metadata(
    current_user: User = Depends(get_current_user),
):
    """Return training metadata: model name, version, metrics, threshold, etc."""
    result = credit_risk_service.get_model_metadata()
    return ApiResponse(message="Model metadata fetched", data=result)


# ===========================================================================
# Per-customer endpoints — features derived automatically from DB
# ===========================================================================

@router_customer.post("/predict", response_model=ApiResponse[dict])
def predict_for_customer(
    shop_id: uuid.UUID,
    customer_id: uuid.UUID,
    save: bool = Query(True, description="Persist prediction to credit_predictions table"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Auto-compute all 18 credit-risk features from the customer's transaction
    history and run the ML model. Optionally saves the result to the database.
    Returns the prediction + the computed feature values for transparency.
    """
    result = credit_risk_service.predict_for_customer(db, shop_id, customer_id, save_result=save)
    return ApiResponse(message="Customer credit risk prediction successful", data=result)


@router_customer.post("/explain", response_model=ApiResponse[dict])
def explain_for_customer(
    shop_id: uuid.UUID,
    customer_id: uuid.UUID,
    top_k: int = Query(5, ge=1, le=18, description="Number of top SHAP drivers"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Auto-compute features from DB and return SHAP-based explanation for this customer.
    Shows which specific behaviours (high outstanding, late repayments, etc.)
    are driving the risk score up or down.
    """
    result = credit_risk_service.explain_for_customer(db, shop_id, customer_id, top_k=top_k)
    return ApiResponse(message="Customer credit risk explanation generated", data=result)
