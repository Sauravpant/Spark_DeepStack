
from __future__ import annotations

import numpy as np

from .explainability import build_explainer, explain_row
from .forecasting_engine import RecursiveForecaster, build_history_frame
from .utils import FORECAST_HORIZON, get_logger

logger = get_logger("demand_forecaster")


class DemandForecaster:
    def __init__(
        self,
        model,
        model_name: str,
        feature_cols: list[str],
        preprocessor,
        feature_engineer,
        metadata: dict,
        feature_importance_table,
        global_shap_table=None,
    ) -> None:
        self.model = model
        self.model_name = model_name
        self.feature_cols = feature_cols
        self.preprocessor = preprocessor
        self.feature_engineer = feature_engineer
        self.metadata = metadata
        self.feature_importance_table = feature_importance_table
        self.global_shap_table = global_shap_table
        # Built lazily on first explain_* call in each process (fast: SHAP's
        # TreeExplainer just parses the already-trained tree structure, it
        # does not retrain anything). Kept out of __init__ so a freshly
        # unpickled object in a new FastAPI worker builds its own explainer
        # cleanly the first time it's needed.
        self._explainer = None

    # -- internal helpers -----------------------------------------------
    def _forecaster(self) -> RecursiveForecaster:
        return RecursiveForecaster(self.model, self.feature_cols, self.preprocessor, self.feature_engineer)

    def _get_explainer(self):
        if self._explainer is None:
            logger.info("Building SHAP explainer for %s (first call in this process)", self.model_name)
            self._explainer = build_explainer(self.model)
        return self._explainer

    def _history_frame(self, shop_id, category, location_type, is_staple, is_perishable,
                        last_date, sales_history, transactions_history):
        return build_history_frame(
            shop_id, category, location_type, is_staple, is_perishable,
            last_date, sales_history, transactions_history,
        )

    def _confidence(self) -> float:
        """Heuristic confidence score in [0, 1], derived from the held-out
        test-set R2 of the selected model. Not a calibrated probability --
        treat it as a coarse "how much does this model generally explain
        variance in demand" signal, not a per-prediction interval."""
        r2 = self.metadata.get("test_r2", 0.0)
        return round(float(np.clip(r2, 0.0, 1.0)), 2)

    # -- public API: predictions -----------------------------------------
    def predict_next_day(self, *, shop_id, category, last_date, sales_history,
                          location_type, is_staple, is_perishable, transactions_history) -> dict:
        history = self._history_frame(shop_id, category, location_type, is_staple,
                                        is_perishable, last_date, sales_history, transactions_history)
        out = self._forecaster().forecast(history, horizon=1)[0]
        return {
            "forecast_date": str(out["date"].date()),
            "predicted_units": out["predicted_units"],
            "model": self.model_name,
            "confidence": self._confidence(),
        }

    def predict_next_7_days(self, *, shop_id, category, last_date, sales_history,
                             location_type, is_staple, is_perishable, transactions_history) -> list[dict]:
        history = self._history_frame(shop_id, category, location_type, is_staple,
                                        is_perishable, last_date, sales_history, transactions_history)
        outputs = self._forecaster().forecast(history, horizon=FORECAST_HORIZON)
        confidence = self._confidence()
        return [
            {
                "forecast_date": str(o["date"].date()),
                "predicted_units": o["predicted_units"],
                "model": self.model_name,
                "confidence": confidence,
            }
            for o in outputs
        ]

    # -- public API: prediction-level explainability -----------------------
    def explain_next_day(self, *, shop_id, category, last_date, sales_history,
                          location_type, is_staple, is_perishable, transactions_history) -> dict:
        history = self._history_frame(shop_id, category, location_type, is_staple,
                                        is_perishable, last_date, sales_history, transactions_history)
        out = self._forecaster().forecast(history, horizon=1)[0]
        explanation = explain_row(self._get_explainer(), out["features"], self.feature_cols, out["predicted_units"])
        explanation["forecast_date"] = str(out["date"].date())
        return explanation

    def explain_next_7_days(self, *, shop_id, category, last_date, sales_history,
                             location_type, is_staple, is_perishable, transactions_history) -> list[dict]:
        history = self._history_frame(shop_id, category, location_type, is_staple,
                                        is_perishable, last_date, sales_history, transactions_history)
        outputs = self._forecaster().forecast(history, horizon=FORECAST_HORIZON)
        explainer = self._get_explainer()
        results = []
        for out in outputs:
            explanation = explain_row(explainer, out["features"], self.feature_cols, out["predicted_units"])
            explanation["forecast_date"] = str(out["date"].date())
            results.append(explanation)
        return results

    # -- public API: global model introspection -----------------------------
    def get_global_feature_importance(self) -> dict:
        return {
            "native_importance": self.feature_importance_table.to_dict(orient="records"),
            "shap_importance": (
                self.global_shap_table.to_dict(orient="records") if self.global_shap_table is not None else None
            ),
        }

    def get_model_metadata(self) -> dict:
        return self.metadata
