from __future__ import annotations

import numpy as np
import pandas as pd

from .utils import (
    DASHAIN_DT,
    GROUP_COLS,
    LAG_DAYS,
    ROLLING_WINDOWS,
    TARGET_COL,
    TIHAR_DT,
    WEEKDAY_ENC,
    festival_ramp,
    nearest_signed_days,
)

TREND_LOOKBACK = 7 

RAW_EXCLUDE = {
    "date", "units_sold", "num_transactions",
    "shop_id", "location_type", "category", "day_of_week",
}


class FeatureEngineer:
    def __init__(
        self,
        lag_days: list[int] = LAG_DAYS,
        rolling_windows: list[int] = ROLLING_WINDOWS,
        group_cols: list[str] = GROUP_COLS,
    ) -> None:
        self.lag_days = lag_days
        self.rolling_windows = rolling_windows
        self.group_cols = group_cols

    # -- target lag / rolling ------------------------------------------------
    def _lag(self, df: pd.DataFrame, col: str, prefix: str) -> pd.DataFrame:
        g = df.groupby(self.group_cols)[col]
        for lag in self.lag_days:
            df[f"{prefix}_lag_{lag}"] = g.shift(lag)
        return df

    def _rolling(self, df: pd.DataFrame, col: str, prefix: str) -> pd.DataFrame:
        df["_shifted_tmp"] = df.groupby(self.group_cols)[col].shift(1)
        for w in self.rolling_windows:
            df[f"{prefix}_rolling_mean_{w}"] = (
                df.groupby(self.group_cols)["_shifted_tmp"].transform(lambda s: s.rolling(w, min_periods=1).mean())
            )
            df[f"{prefix}_rolling_std_{w}"] = (
                df.groupby(self.group_cols)["_shifted_tmp"].transform(lambda s: s.rolling(w, min_periods=2).std())
            )
        df.drop(columns=["_shifted_tmp"], inplace=True)
        return df

    def _txn_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = self._lag(df, "num_transactions", "txn")
        df["_txn_shift_tmp"] = df.groupby(self.group_cols)["num_transactions"].shift(1)
        df["txn_rolling_mean_7"] = (
            df.groupby(self.group_cols)["_txn_shift_tmp"].transform(lambda s: s.rolling(7, min_periods=1).mean())
        )
        df.drop(columns=["_txn_shift_tmp"], inplace=True)
        return df

    def _calendar(self, df: pd.DataFrame) -> pd.DataFrame:
        dt = df["date"]
        df["day_of_week"] = dt.dt.day_name()
        df["day_of_week_enc"] = df["day_of_week"].map(WEEKDAY_ENC).fillna(0).astype(int)
        df["day_of_month"] = dt.dt.day
        df["week_of_year"] = dt.dt.isocalendar().week.astype(int)
        df["month"] = dt.dt.month
        df["quarter"] = dt.dt.quarter
        df["year"] = dt.dt.year
        # Nepali kirana weekend = Saturday (matches the synthetic generator)
        df["is_weekend"] = (df["day_of_week"] == "Saturday").astype(int)
        df["is_month_end"] = df["day_of_month"].isin([1, 2, 3, 28, 29, 30, 31]).astype(int)
        return df

    def _festival(self, df: pd.DataFrame) -> pd.DataFrame:
        df["days_to_dashain"] = nearest_signed_days(df["date"], DASHAIN_DT)
        df["days_to_tihar"] = nearest_signed_days(df["date"], TIHAR_DT)
        df["dashain_ramp"] = festival_ramp(df["days_to_dashain"])
        df["tihar_ramp"] = festival_ramp(df["days_to_tihar"])
        df["is_dashain_window"] = (df["dashain_ramp"] > 0).astype(int)
        df["is_tihar_window"] = (df["tihar_ramp"] > 0).astype(int)
        df["is_festival_window"] = ((df["is_dashain_window"] == 1) | (df["is_tihar_window"] == 1)).astype(int)
        df["days_to_nearest_festival"] = df[["days_to_dashain", "days_to_tihar"]].abs().min(axis=1)
        df["is_pre_festival_peak"] = (
            df["days_to_dashain"].between(-7, 0) | df["days_to_tihar"].between(-7, 0)
        ).astype(int)
        return df

    def _trend(self, df: pd.DataFrame) -> pd.DataFrame:
        df["momentum"] = df["units_lag_1"] - df["units_lag_7"]
        df["growth_rate"] = (
            (df["units_rolling_mean_3"] - df["units_rolling_mean_7"])
            / df["units_rolling_mean_7"].replace(0, np.nan)
        ).fillna(0.0)
        df["moving_average_ratio"] = (
            df["units_lag_1"] / df["units_rolling_mean_7"].replace(0, np.nan)
        ).fillna(1.0)

        lag_cols_chronological = [f"units_lag_{l}" for l in sorted(self.lag_days, reverse=True) if l <= TREND_LOOKBACK]

        def _slope(row_values: np.ndarray) -> float:
            y = np.asarray(row_values, dtype=float)
            if np.isnan(y).any() or len(y) < 2:
                return 0.0
            x = np.arange(len(y))
            return float(np.polyfit(x, y, 1)[0])

        if len(lag_cols_chronological) >= 2:
            df["trend_slope"] = df[lag_cols_chronological].apply(_slope, axis=1)
        else:
            df["trend_slope"] = 0.0
        return df

    def _entity(self, df: pd.DataFrame, preprocessor) -> pd.DataFrame:
        stats = preprocessor.entity_stats
        global_avg = stats.get("global_avg_demand", 0.0)
        shop_map = stats.get("shop_avg_demand", {})
        cat_map = stats.get("category_avg_demand", {})
        sc_map = stats.get("shop_category_avg_demand", {})

        df["shop_avg_demand"] = df["shop_id"].map(shop_map).fillna(global_avg)
        df["category_avg_demand"] = df["category"].map(cat_map).fillna(global_avg)
        df["shop_category_avg_demand"] = (
            pd.Series(list(zip(df["shop_id"], df["category"])), index=df.index).map(sc_map).fillna(global_avg)
        )
        df["shop_vs_category_avg_ratio"] = (
            df["shop_category_avg_demand"] / df["category_avg_demand"].replace(0, np.nan)
        ).fillna(1.0)
        return df

    def run(self, df: pd.DataFrame, preprocessor) -> pd.DataFrame:
        df = self._lag(df, TARGET_COL, "units")
        df = self._rolling(df, TARGET_COL, "units")
        df = self._txn_features(df)
        df = self._calendar(df)
        df = self._festival(df)
        df = self._trend(df)
        df = self._entity(df, preprocessor)
        return df


def get_feature_columns(df: pd.DataFrame) -> list[str]:
    """Final, leakage-free, model-ready feature set."""
    return [c for c in df.columns if c not in RAW_EXCLUDE]
