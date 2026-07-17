
from __future__ import annotations

import joblib

DEFAULT_ARTIFACT_PATH = "models/forecasting_pipeline.joblib"

_forecaster = None  # process-level cache


def load_forecaster(path: str = DEFAULT_ARTIFACT_PATH):
    """Load once (e.g. at FastAPI startup) and reuse across all requests."""
    global _forecaster
    if _forecaster is None:
        _forecaster = joblib.load(path)
    return _forecaster


def predict_next_day(**kwargs) -> dict:
    return load_forecaster().predict_next_day(**kwargs)


def predict_next_7_days(**kwargs) -> list[dict]:
    return load_forecaster().predict_next_7_days(**kwargs)


def explain_next_day(**kwargs) -> dict:
    return load_forecaster().explain_next_day(**kwargs)


def explain_next_7_days(**kwargs) -> list[dict]:
    return load_forecaster().explain_next_7_days(**kwargs)


def get_global_feature_importance() -> dict:
    return load_forecaster().get_global_feature_importance()


def get_model_metadata() -> dict:
    return load_forecaster().get_model_metadata()
