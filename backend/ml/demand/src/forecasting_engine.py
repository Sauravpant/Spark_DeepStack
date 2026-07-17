
from __future__ import annotations

from datetime import datetime

import numpy as np
import pandas as pd

from .utils import FORECAST_HORIZON, MIN_HISTORY_DAYS, get_logger

logger = get_logger("forecasting_engine")


def build_history_frame(
    shop_id: str,
    category: str,
    location_type: str,
    is_staple,
    is_perishable,
    last_date,
    sales_history: list,
    transactions_history: list,
) -> pd.DataFrame:
    """
    sales_history / transactions_history must be ordered OLDEST -> NEWEST,
    with the LAST element corresponding to `last_date` itself. Both lists
    must be the same length and at least MIN_HISTORY_DAYS (21) long.
    """
    if isinstance(last_date, str):
        last_date = datetime.strptime(last_date, "%Y-%m-%d")
    last_date = pd.Timestamp(last_date)

    n = len(sales_history)
    if len(transactions_history) != n:
        raise ValueError("sales_history and transactions_history must be the same length")
    if n < MIN_HISTORY_DAYS:
        raise ValueError(
            f"Need at least {MIN_HISTORY_DAYS} days of trailing daily history "
            f"(got {n}). This covers the 14-day max lag plus a safety buffer "
            f"for stable rolling/trend statistics."
        )

    dates = pd.date_range(end=last_date, periods=n, freq="D")
    df = pd.DataFrame({
        "date": dates,
        "shop_id": shop_id,
        "location_type": location_type,
        "category": category,
        "is_staple": int(is_staple),
        "is_perishable": int(is_perishable),
        "units_sold": sales_history,
        "num_transactions": transactions_history,
    })
    return df


class RecursiveForecaster:
    def __init__(self, model, feature_cols, preprocessor, feature_engineer) -> None:
        self.model = model
        self.feature_cols = feature_cols
        self.preprocessor = preprocessor
        self.feature_engineer = feature_engineer

    def _feature_row_for_last_day(self, working: pd.DataFrame):
        working = self.preprocessor.transform_categoricals(working)
        working = self.feature_engineer.run(working, self.preprocessor)
        row = working.iloc[[-1]][self.feature_cols].fillna(0)
        return row, working

    def step(self, working: pd.DataFrame):
        """One recursive step: append a placeholder next-day row, build its
        feature vector, predict, and write the prediction back into history
        so the NEXT step sees it as real trailing data."""
        last_row = working.iloc[-1]
        next_date = last_row["date"] + pd.Timedelta(days=1)

        new_row = {
            "date": next_date,
            "shop_id": last_row["shop_id"],
            "location_type": last_row["location_type"],
            "category": last_row["category"],
            "is_staple": last_row["is_staple"],
            "is_perishable": last_row["is_perishable"],
            "units_sold": np.nan,
            "num_transactions": np.nan,
        }
        working = pd.concat([working, pd.DataFrame([new_row])], ignore_index=True)

        X_next, working = self._feature_row_for_last_day(working)
        pred = float(self.model.predict(X_next)[0])
        pred = max(0.0, round(pred))
        working.loc[working.index[-1], "units_sold"] = pred

        # carry forward the recent transactions-per-unit ratio for a stable
        # num_transactions estimate (only used to keep future txn-lag
        # features sane; never itself a target)
        recent_units = working["units_sold"].iloc[:-1].tail(7)
        recent_txn = working["num_transactions"].iloc[:-1].tail(7)
        ratio_series = (recent_txn / recent_units.replace(0, np.nan))
        ratio = float(ratio_series.mean()) if not ratio_series.dropna().empty else 1.0
        working.loc[working.index[-1], "num_transactions"] = max(1, round(pred * ratio)) if pred > 0 else 0

        return next_date, pred, X_next, working

    def forecast(self, history_df: pd.DataFrame, horizon: int = FORECAST_HORIZON) -> list[dict]:
        working = history_df.copy()
        outputs = []
        for _ in range(horizon):
            next_date, pred, X_next, working = self.step(working)
            outputs.append({"date": next_date, "predicted_units": pred, "features": X_next})
        return outputs
