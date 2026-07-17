"""
Credit Risk Schemas
===================
Pydantic request / response models for the Credit Risk API.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request
# ---------------------------------------------------------------------------

class CreditRiskPredictRequest(BaseModel):
    """
    All 18 features expected by the CreditRiskPredictor.
    When not provided, reasonable defaults of 0 are used, but for accurate
    predictions all fields should be supplied.
    """
    relationship_days: int = Field(..., ge=0, description="Days since the customer first transacted")
    cash_purchase_value_last_30d: float = Field(..., ge=0, description="Total cash purchase value in last 30 days")
    credit_purchase_value_last_30d: float = Field(..., ge=0, description="Total credit purchase value in last 30 days")
    transaction_count_last_30d: int = Field(..., ge=0, description="Total transactions in last 30 days")
    credit_transaction_count_last_30d: int = Field(..., ge=0, description="Credit-only transaction count in last 30 days")
    avg_purchase_amount: float = Field(..., ge=0, description="Average amount per purchase (all types)")
    avg_credit_transaction_amount: float = Field(..., ge=0, description="Average amount per credit transaction")
    credit_to_purchase_ratio: float = Field(..., ge=0, description="Fraction of total value bought on credit")
    current_outstanding_balance: float = Field(..., ge=0, description="Current unpaid credit balance (NPR)")
    outstanding_to_avg_transaction_ratio: float = Field(..., ge=0, description="Outstanding balance / avg transaction amount")
    pct_repaid_on_time: float = Field(..., ge=0, le=1, description="Fraction of credit cycles repaid by due date")
    avg_days_to_repay: float = Field(..., ge=0, description="Average calendar days taken to repay")
    repayment_consistency: float = Field(..., ge=0, description="Std-dev of days-to-repay (lower = more consistent)")
    historical_repayment_ratio: float = Field(..., ge=0, le=1, description="Fraction of all credit ever taken that has been repaid")
    num_completed_credit_cycles: int = Field(..., ge=0, description="Total fully closed credit cycles")
    num_severely_late_repayments: int = Field(..., ge=0, description="Credit cycles repaid > 30 days late")
    max_outstanding_ever: float = Field(..., ge=0, description="Maximum outstanding balance ever recorded")
    days_since_last_purchase: int = Field(..., ge=0, description="Days elapsed since the customer's last purchase")


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class ShapFeature(BaseModel):
    feature: str
    shap_value: float


class CreditRiskPredictResponse(BaseModel):
    risk_prediction: int = Field(..., description="1 = high risk, 0 = low risk")
    risk_probability: float = Field(..., description="Calibrated probability of being a credit risk (0-1)")
    is_risk: bool
    threshold: float = Field(..., description="Decision threshold used")
    confidence: float
    model: str


class CreditRiskExplainResponse(BaseModel):
    risk_prediction: int
    risk_probability: float
    is_risk: bool
    threshold: float
    base_probability: float = Field(..., description="SHAP base value (model's average output)")
    top_positive_features: List[ShapFeature] = Field(..., description="Features that push the risk HIGHER")
    top_negative_features: List[ShapFeature] = Field(..., description="Features that push the risk LOWER")
    feature_contributions: Dict[str, float] = Field(..., description="Full SHAP value map for all features")
    human_readable_explanation: str


class GlobalImportanceFeature(BaseModel):
    feature: str
    mean_abs_shap: float
    rank: int


class CreditRiskGlobalImportanceResponse(BaseModel):
    ranked_features: List[str]
    mean_abs_shap_values: Dict[str, float]
    feature_importance_table: List[Dict[str, Any]]


class CreditRiskModelMetadataResponse(BaseModel):
    metadata: Dict[str, Any]
