"""
ML Model Manager
================
Loads and caches both ML models at application startup using FastAPI lifespan.
Both models are loaded exactly once per process and reused across all requests.

- CreditRiskPredictor  -> credit_risk_pipeline.joblib
- DemandForecaster     -> forecasting_pipeline.joblib
"""
from __future__ import annotations

import logging
import sys
from pathlib import Path

import joblib

logger = logging.getLogger(__name__)

# Project root relative to this file: backend/
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent  # backend/

CREDIT_RISK_MODEL_PATH = _BACKEND_ROOT / "ml" / "credit_risk" / "models" / "credit_risk_pipeline.joblib"
DEMAND_MODEL_PATH = _BACKEND_ROOT / "ml" / "demand" / "models" / "forecasting_pipeline.joblib"

# Process-level singletons
_credit_risk_predictor = None
_demand_forecaster = None


def load_credit_risk_model():
    """Load (and cache) the CreditRiskPredictor pipeline."""
    global _credit_risk_predictor
    if _credit_risk_predictor is None:
        if not CREDIT_RISK_MODEL_PATH.exists():
            logger.error(
                "Credit risk model not found at %s. "
                "Run `python train.py` in ml/credit_risk/ first.",
                CREDIT_RISK_MODEL_PATH,
            )
            return None
        logger.info("Loading credit risk model from %s ...", CREDIT_RISK_MODEL_PATH)
        # Add the ml/credit_risk directory to sys.path so that the
        # pickled CreditRiskPredictor class can be resolved.
        credit_risk_dir = str(CREDIT_RISK_MODEL_PATH.parent.parent)
        if credit_risk_dir not in sys.path:
            sys.path.insert(0, credit_risk_dir)
        _credit_risk_predictor = joblib.load(CREDIT_RISK_MODEL_PATH)
        logger.info("Credit risk model loaded: %r", _credit_risk_predictor)
    return _credit_risk_predictor


def load_demand_model():
    """Load (and cache) the DemandForecaster pipeline."""
    global _demand_forecaster
    if _demand_forecaster is None:
        if not DEMAND_MODEL_PATH.exists():
            logger.error(
                "Demand model not found at %s. "
                "Run `python train.py` in ml/demand/ first.",
                DEMAND_MODEL_PATH,
            )
            return None
        logger.info("Loading demand forecasting model from %s ...", DEMAND_MODEL_PATH)
        # Add the ml/demand directory to sys.path so that the
        # pickled DemandForecaster class can be resolved.
        demand_dir = str(DEMAND_MODEL_PATH.parent.parent)
        if demand_dir not in sys.path:
            sys.path.insert(0, demand_dir)
        _demand_forecaster = joblib.load(DEMAND_MODEL_PATH)
        logger.info("Demand forecasting model loaded: %s", type(_demand_forecaster).__name__)
    return _demand_forecaster


def get_credit_risk_predictor():
    """Return the cached CreditRiskPredictor. Must be called after load_credit_risk_model()."""
    return _credit_risk_predictor


def get_demand_forecaster():
    """Return the cached DemandForecaster. Must be called after load_demand_model()."""
    return _demand_forecaster
