"""
Thin convenience wrapper around the serialized `CreditRiskPredictor` artifact.

Intended for internal callers (batch jobs, notebooks, cron scripts, other
services) that just want `load_predictor()` plus one of the module-level
prediction functions, without importing the `CreditRiskPredictor` class
directly. `deployment/app.py` (the FastAPI service) follows this exact same
"load once, reuse for every request" pattern.
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Union

import joblib

from .config import MODEL_ARTIFACT_PATH


@lru_cache(maxsize=1)
def load_predictor(model_path: Union[str, Path] = MODEL_ARTIFACT_PATH) -> Any:
    """Load (and cache in-process) the single deployable credit risk artifact.

    Cached with `lru_cache` so repeated calls - e.g. once per incoming HTTP
    request - do not re-read the file from disk; the object is loaded exactly
    once per process lifetime.
    """
    model_path = Path(model_path)
    if not model_path.exists():
        raise FileNotFoundError(
            f"No trained model found at {model_path}. Run `python train.py` first."
        )
    return joblib.load(model_path)


def predict(**raw_features: Any) -> Dict[str, Any]:
    return load_predictor().predict(**raw_features)


def predict_probability(**raw_features: Any) -> Dict[str, Any]:
    return load_predictor().predict_probability(**raw_features)


def explain_prediction(**raw_features: Any) -> Dict[str, Any]:
    return load_predictor().explain_prediction(**raw_features)


def get_global_feature_importance() -> Dict[str, Any]:
    return load_predictor().get_global_feature_importance()


def get_model_metadata() -> Dict[str, Any]:
    return load_predictor().get_model_metadata()
