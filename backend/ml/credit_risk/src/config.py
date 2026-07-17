
from __future__ import annotations

from pathlib import Path
from typing import List

PROJECT_ROOT = Path(__file__).resolve().parent.parent

DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
RAW_DATA_PATH = RAW_DATA_DIR / "credit_risk_dataset.csv"

MODELS_DIR = PROJECT_ROOT / "models"
MODEL_ARTIFACT_PATH = MODELS_DIR / "credit_risk_pipeline.joblib"

ARTIFACTS_DIR = PROJECT_ROOT / "artifacts"
LOGS_DIR = PROJECT_ROOT / "logs"

for _dir in (RAW_DATA_DIR, PROCESSED_DATA_DIR, MODELS_DIR, ARTIFACTS_DIR, LOGS_DIR):
    _dir.mkdir(parents=True, exist_ok=True)

RANDOM_SEED = 42

TARGET_COLUMN = "is_risk"

FEATURE_COLUMNS: List[str] = [
    "relationship_days",
    "cash_purchase_value_last_30d",
    "credit_purchase_value_last_30d",
    "transaction_count_last_30d",
    "credit_transaction_count_last_30d",
    "avg_purchase_amount",
    "avg_credit_transaction_amount",
    "credit_to_purchase_ratio",
    "current_outstanding_balance",
    "outstanding_to_avg_transaction_ratio",
    "pct_repaid_on_time",
    "avg_days_to_repay",
    "repayment_consistency",
    "historical_repayment_ratio",
    "num_completed_credit_cycles",
    "num_severely_late_repayments",
    "max_outstanding_ever",
    "days_since_last_purchase",
]

NON_NEGATIVE_FEATURES: List[str] = [
    "relationship_days",
    "cash_purchase_value_last_30d",
    "credit_purchase_value_last_30d",
    "transaction_count_last_30d",
    "credit_transaction_count_last_30d",
    "avg_purchase_amount",
    "avg_credit_transaction_amount",
    "num_completed_credit_cycles",
    "num_severely_late_repayments",
    "max_outstanding_ever",
    "days_since_last_purchase",
    "avg_days_to_repay",
    "repayment_consistency",
]

UNIT_RATIO_FEATURES: List[str] = [
    "pct_repaid_on_time",
    "historical_repayment_ratio",
]

INTEGER_FEATURES: List[str] = [
    "relationship_days",
    "transaction_count_last_30d",
    "credit_transaction_count_last_30d",
    "num_completed_credit_cycles",
    "num_severely_late_repayments",
    "days_since_last_purchase",
]


TEST_SIZE = 0.15          # held out, untouched until final unbiased reporting
VAL_SIZE = 0.15           # relative to the FULL dataset (not the remainder)
CALIBRATION_SPLIT = 0.5   # fraction of the validation set used to fit the calibrator
                            # (the remaining half is used for threshold search / method choice)


THRESHOLD_GRID_MIN = 0.05
THRESHOLD_GRID_MAX = 0.95
THRESHOLD_GRID_STEP = 0.01


CALIBRATION_METHODS = ["isotonic", "sigmoid"]

MODEL_VERSION = "1.0.0"
SHAP_BACKGROUND_SAMPLE_SIZE = 500
SHAP_GLOBAL_IMPORTANCE_SAMPLE_SIZE = 1000
