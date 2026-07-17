from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List

import pandas as pd

from .config import FEATURE_COLUMNS, MODEL_VERSION
from .explainability import ShapExplainer, human_readable_explanation
from .preprocessing import CreditRiskPreprocessor

logger = logging.getLogger(__name__)


@dataclass
class CreditRiskPredictor:
    preprocessor: CreditRiskPreprocessor
    model: Any
    shap_explainer: ShapExplainer
    optimal_threshold: float
    global_feature_importance: pd.DataFrame
    metadata: Dict[str, Any] = field(default_factory=dict)
    feature_columns: List[str] = field(default_factory=lambda: list(FEATURE_COLUMNS))


    def _prepare(self, raw_features: Dict[str, Any]) -> pd.DataFrame:
        """Validate + preprocess a single raw customer record into a model-ready frame."""
        return self.preprocessor.transform_single(raw_features)

    def _predict_proba(self, X: pd.DataFrame) -> float:
        proba = self.model.predict_proba(X)[:, 1]
        return float(proba[0])


    def predict_probability(self, **raw_features: Any) -> Dict[str, Any]:
        X = self._prepare(raw_features)
        proba = self._predict_proba(X)
        return {"risk_probability": round(proba, 4)}

    def predict(self, **raw_features: Any) -> Dict[str, Any]:
        X = self._prepare(raw_features)
        proba = self._predict_proba(X)
        prediction = int(proba >= self.optimal_threshold)
        return {
            "risk_prediction": prediction,
            "risk_probability": round(proba, 4),
            "is_risk": bool(prediction),
            "threshold": self.optimal_threshold,
            "confidence": round(proba, 4),
            "model": self.metadata.get("model", "unknown"),
        }

    def explain_prediction(self, top_k: int = 5, **raw_features: Any) -> Dict[str, Any]:
        """Return the calibrated prediction alongside a SHAP-based explanation
        for THIS specific customer, using the exact feature vector used for
        prediction.
        """
        X = self._prepare(raw_features)
        proba = self._predict_proba(X)
        prediction = int(proba >= self.optimal_threshold)

        shap_result = self.shap_explainer.explain_row(X, top_k=top_k)
        explanation_text = human_readable_explanation(
            shap_result["top_positive_features"], shap_result["top_negative_features"]
        )

        return {
            "risk_prediction": prediction,
            "risk_probability": round(proba, 4),
            "is_risk": bool(prediction),
            "threshold": self.optimal_threshold,
            "base_probability": shap_result["base_value"],
            "base_value": shap_result["base_value"],
            "top_positive_features": shap_result["top_positive_features"],
            "top_negative_features": shap_result["top_negative_features"],
            "feature_contributions": shap_result["feature_contributions"],
            "human_readable_explanation": explanation_text,
        }

    def get_global_feature_importance(self) -> Dict[str, Any]:
        """Return the ranked global SHAP feature-importance table computed at training time."""
        return {
            "ranked_features": self.global_feature_importance["feature"].tolist(),
            "mean_abs_shap_values": {
                row["feature"]: round(float(row["mean_abs_shap"]), 6)
                for _, row in self.global_feature_importance.iterrows()
            },
            "feature_importance_table": self.global_feature_importance.to_dict(orient="records"),
        }

    def get_model_metadata(self) -> Dict[str, Any]:
        """Return training/version metadata for observability & model governance."""
        return dict(self.metadata)

    def __repr__(self) -> str: 
        return (
            f"CreditRiskPredictor(model={self.metadata.get('model')!r}, "
            f"version={self.metadata.get('version', MODEL_VERSION)!r}, "
            f"threshold={self.optimal_threshold})"
        )
