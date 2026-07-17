"""
SHAP-based explainability layer for the VyaparAI Credit Risk Predictor.

Design note - explaining a CALIBRATED model
---------------------------------------------
`ShapExplainer` is built on the *base* (pre-calibration) model, since SHAP's
additive decomposition is only mathematically well-defined for the estimator
that directly produced the scores it is explaining (a `CalibratedClassifierCV`
wrapper is not a single differentiable/tree function SHAP can decompose
cleanly). The probability returned to the business (`risk_probability`) is
still the *calibrated* one - calibration is a monotonic-ish rescaling of the
base model's score, so the SHAP-based ranking of "what drove this score up or
down" remains a faithful, readable explanation of the calibrated decision
even though the raw SHAP numbers are on the base model's output scale.
This trade-off (calibrated probability + base-model SHAP ranking) is the
standard, documented practice for explainable calibrated risk models.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
import shap

from .config import FEATURE_COLUMNS

logger = logging.getLogger(__name__)

# Model classes SHAP's fast, exact TreeExplainer supports.
TREE_MODEL_NAMES = {
    "CatBoostClassifier",
    "XGBClassifier",
    "LGBMClassifier",
    "RandomForestClassifier",
    "ExtraTreesClassifier",
    "HistGradientBoostingClassifier",
    "BalancedRandomForestClassifier",
}

# Human-friendly descriptions for the business-facing explanation sentence.
_FEATURE_LABELS: Dict[str, str] = {
    "current_outstanding_balance": "a high outstanding balance",
    "outstanding_to_avg_transaction_ratio": "an outstanding balance that is large relative to typical purchases",
    "pct_repaid_on_time": "a low percentage of on-time repayments",
    "num_severely_late_repayments": "multiple severely late repayments",
    "avg_days_to_repay": "a history of slow repayments",
    "repayment_consistency": "inconsistent repayment timing",
    "historical_repayment_ratio": "a low historical repayment ratio",
    "credit_to_purchase_ratio": "heavy reliance on credit purchases",
    "relationship_days": "the length of the customer relationship",
    "num_completed_credit_cycles": "the number of completed credit cycles",
    "max_outstanding_ever": "a high past outstanding balance",
    "days_since_last_purchase": "days since the last purchase",
    "transaction_count_last_30d": "recent transaction activity",
    "credit_transaction_count_last_30d": "recent credit transaction activity",
    "cash_purchase_value_last_30d": "recent cash purchase volume",
    "credit_purchase_value_last_30d": "recent credit purchase volume",
    "avg_purchase_amount": "typical purchase size",
    "avg_credit_transaction_amount": "typical credit transaction size",
}


class ShapExplainer:
    """Wraps a fitted SHAP explainer over the uncalibrated base model."""

    def __init__(self, base_model: Any, background_data: pd.DataFrame, feature_names: Optional[List[str]] = None):
        self.feature_names = feature_names or list(FEATURE_COLUMNS)
        self.model_class_name = type(base_model).__name__
        self._explainer = self._build_explainer(base_model, background_data)

    def _build_explainer(self, base_model: Any, background_data: pd.DataFrame):
        try:
            if self.model_class_name in TREE_MODEL_NAMES:
                return shap.TreeExplainer(base_model)
            sample = background_data.sample(min(100, len(background_data)), random_state=42)
            return shap.Explainer(base_model.predict_proba, sample)
        except Exception as exc:  # pragma: no cover - defensive fallback across shap/model versions
            logger.warning("TreeExplainer unavailable for %s (%s); falling back to generic Explainer.",
                            self.model_class_name, exc)
            sample = background_data.sample(min(100, len(background_data)), random_state=42)
            return shap.Explainer(base_model.predict_proba, sample)

    # ------------------------------------------------------------------
    # Low-level SHAP value extraction (handles the several output shapes
    # different shap versions / model types can return for binary classifiers)
    # ------------------------------------------------------------------
    def _raw_explanation(self, X: pd.DataFrame):
        return self._explainer(X)

    def shap_values_for(self, X: pd.DataFrame) -> np.ndarray:
        """Return a (n_rows, n_features) array of SHAP values for the POSITIVE class."""
        raw = self._raw_explanation(X)
        values = np.asarray(raw.values)
        if values.ndim == 3:
            # shape (n_rows, n_features, n_classes) - take the positive class
            values = values[:, :, 1] if values.shape[-1] > 1 else values[:, :, 0]
        return values

    def base_value_for(self, X: pd.DataFrame) -> float:
        raw = self._raw_explanation(X)
        base = np.asarray(raw.base_values)
        if base.ndim == 0:
            return float(base)
        if base.ndim == 2:  # (n_rows, n_classes) - take positive class of first row
            return float(base[0, -1])
        return float(base[0])

    # ------------------------------------------------------------------
    # Public explanation API
    # ------------------------------------------------------------------
    def global_importance(self, X: pd.DataFrame, top_n: Optional[int] = None) -> pd.DataFrame:
        """Rank features by mean absolute SHAP value over a representative sample."""
        shap_vals = self.shap_values_for(X)
        mean_abs = np.abs(shap_vals).mean(axis=0)
        df = pd.DataFrame({"feature": self.feature_names, "mean_abs_shap": mean_abs})
        df = df.sort_values("mean_abs_shap", ascending=False).reset_index(drop=True)
        df["rank"] = np.arange(1, len(df) + 1)
        if top_n:
            df = df.head(top_n)
        return df

    def explain_row(self, X_row: pd.DataFrame, top_k: int = 5) -> Dict[str, Any]:
        """Explain a single-row dataframe: contributions + top positive/negative drivers."""
        shap_vals = self.shap_values_for(X_row)[0]
        base_value = self.base_value_for(X_row)

        contributions = {feat: float(val) for feat, val in zip(self.feature_names, shap_vals)}
        ordered = sorted(contributions.items(), key=lambda kv: kv[1], reverse=True)

        positives = [(f, v) for f, v in ordered if v > 0]
        negatives = sorted([(f, v) for f, v in ordered if v < 0], key=lambda kv: kv[1])  # most negative first

        top_positive = [{"feature": f, "shap_value": round(v, 5)} for f, v in positives[:top_k]]
        top_negative = [{"feature": f, "shap_value": round(v, 5)} for f, v in negatives[:top_k]]

        return {
            "base_value": round(base_value, 5),
            "feature_contributions": {k: round(v, 5) for k, v in contributions.items()},
            "top_positive_features": top_positive,
            "top_negative_features": top_negative,
        }


def human_readable_explanation(top_positive: List[Dict[str, Any]], top_negative: List[Dict[str, Any]]) -> str:
    """Translate the top SHAP drivers into a plain-language, business-friendly sentence."""

    def describe(items: List[Dict[str, Any]]) -> List[str]:
        return [_FEATURE_LABELS.get(item["feature"], item["feature"].replace("_", " ")) for item in items]

    pos_desc = describe(top_positive[:3])
    neg_desc = describe(top_negative[:3])

    parts: List[str] = []
    if pos_desc:
        parts.append(f"The predicted risk is primarily driven by {_join(pos_desc)}.")
    if neg_desc:
        verb = "reduces" if len(neg_desc) == 1 else "reduce"
        parts.append(f"{_capitalize(_join(neg_desc))} {verb} the overall risk.")

    return " ".join(parts) if parts else "No dominant risk drivers were identified for this customer."


def _join(items: List[str]) -> str:
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return f"{items[0]} and {items[1]}"
    return ", ".join(items[:-1]) + f", and {items[-1]}"


def _capitalize(s: str) -> str:
    return s[0].upper() + s[1:] if s else s
