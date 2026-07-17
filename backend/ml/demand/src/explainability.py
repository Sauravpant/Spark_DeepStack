
from __future__ import annotations

import numpy as np
import pandas as pd
import shap

from .utils import get_logger

logger = get_logger("explainability")

TOP_K = 5

_FEATURE_PHRASES = {
    "momentum": "recent sales momentum",
    "growth_rate": "an accelerating short-term growth trend",
    "trend_slope": "an upward recent trend",
    "moving_average_ratio": "sales running above their recent average",
    "dashain_ramp": "the approaching Dashain festival window",
    "tihar_ramp": "the approaching Tihar festival window",
    "is_dashain_window": "being inside the Dashain festival window",
    "is_tihar_window": "being inside the Tihar festival window",
    "is_pre_festival_peak": "the pre-festival demand peak",
    "is_weekend": "the Saturday weekend effect",
    "is_month_end": "the month-end shopping effect",
    "units_rolling_mean_7": "a strong 7-day average demand level",
    "units_rolling_mean_3": "a strong 3-day average demand level",
    "shop_category_avg_demand": "this shop-category's typical historical demand",
    "shop_avg_demand": "this shop's typical historical demand",
    "category_avg_demand": "this category's typical historical demand",
    "txn_rolling_mean_7": "recent transaction volume",
}


def build_explainer(model):
    try:
        return shap.TreeExplainer(model)
    except Exception as exc:  # pragma: no cover
        logger.warning("shap.TreeExplainer failed (%s); falling back to generic shap.Explainer", exc)
        return shap.Explainer(model)


def _phrase(feature: str) -> str:
    for key, phrase in _FEATURE_PHRASES.items():
        if key in feature:
            return phrase
    return feature.replace("_", " ")


def human_readable_explanation(top_positive: list[dict], top_negative: list[dict]) -> str:
    if not top_positive and not top_negative:
        return "This prediction is close to the shop-category's typical baseline demand."
    parts = []
    if top_positive:
        drivers = ", ".join(_phrase(f["feature"]) for f in top_positive[:2])
        parts.append(f"Demand increased mainly because of {drivers}")
    if top_negative:
        drivers = ", ".join(_phrase(f["feature"]) for f in top_negative[:2])
        parts.append(f"pulled down by {drivers}")
    return "; ".join(parts) + "."


def explain_row(explainer, X_row: pd.DataFrame, feature_cols: list[str], prediction: float) -> dict:
    shap_values = explainer.shap_values(X_row)
    sv = np.asarray(shap_values).reshape(-1)
    expected = explainer.expected_value
    base_value = float(np.asarray(expected).reshape(-1)[0])

    contributions = dict(zip(feature_cols, sv.tolist()))
    ranked = sorted(contributions.items(), key=lambda kv: kv[1], reverse=True)
    top_positive = [{"feature": f, "impact": round(v, 4)} for f, v in ranked if v > 0][:TOP_K]
    top_negative = [{"feature": f, "impact": round(v, 4)} for f, v in ranked if v < 0][-TOP_K:][::-1]

    return {
        "prediction": prediction,
        "base_value": round(base_value, 2),
        "top_positive_features": top_positive,
        "top_negative_features": top_negative,
        "feature_contributions": {k: round(v, 4) for k, v in contributions.items()},
        "human_readable_explanation": human_readable_explanation(top_positive, top_negative),
    }


def global_importance_table(explainer, X_sample: pd.DataFrame, feature_cols: list[str]) -> pd.DataFrame:
    shap_values = explainer.shap_values(X_sample)
    mean_abs = np.abs(shap_values).mean(axis=0)
    return (
        pd.DataFrame({"feature": feature_cols, "mean_abs_shap": mean_abs})
        .sort_values("mean_abs_shap", ascending=False)
        .reset_index(drop=True)
    )
