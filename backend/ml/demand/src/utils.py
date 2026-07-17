
from __future__ import annotations

import logging

import numpy as np
import pandas as pd


RANDOM_SEED: int = 42
TARGET_COL: str = "units_sold"
GROUP_COLS: list[str] = ["shop_id", "category"]

LAG_DAYS: list[int] = [1, 2, 3, 7, 14]
ROLLING_WINDOWS: list[int] = [3, 7, 14]
MAX_LAG: int = max(LAG_DAYS)


MIN_HISTORY_DAYS: int = MAX_LAG + 7  # = 21

FORECAST_HORIZON: int = 7


DASHAIN_DATES: dict[int, str] = {
    2020: "2020-10-25", 2021: "2021-10-15", 2022: "2022-10-05",
    2023: "2023-10-24", 2024: "2024-10-12", 2025: "2025-10-06", 2026: "2026-10-20",
}
TIHAR_DATES: dict[int, str] = {
    2020: "2020-11-14", 2021: "2021-11-04", 2022: "2022-10-24",
    2023: "2023-11-12", 2024: "2024-11-01", 2025: "2025-10-20", 2026: "2026-11-08",
}
DASHAIN_DT = pd.to_datetime(list(DASHAIN_DATES.values()))
TIHAR_DT = pd.to_datetime(list(TIHAR_DATES.values()))

FESTIVAL_BUILD_DAYS = 15
FESTIVAL_PEAK_OFFSET = -2
FESTIVAL_DECAY_DAYS = 4

WEEKDAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
WEEKDAY_ENC = {d: i for i, d in enumerate(WEEKDAY_ORDER)}


def get_logger(name: str) -> logging.Logger:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)-8s | %(message)s",
        datefmt="%H:%M:%S",
    )
    return logging.getLogger(name)


def nearest_signed_days(date_series: pd.Series, festival_dt: pd.DatetimeIndex) -> np.ndarray:
    """Signed day distance to the nearest festival date (negative = before,
    positive = after), vectorized over an arbitrary array of dates."""
    d = pd.to_datetime(date_series).values.astype("datetime64[D]")
    f = festival_dt.values.astype("datetime64[D]")
    diffs = (d[:, None] - f[None, :]).astype("timedelta64[D]").astype(int)
    idx = np.argmin(np.abs(diffs), axis=1)
    return diffs[np.arange(len(d)), idx]


def festival_ramp(
    days_diff,
    build_days: int = FESTIVAL_BUILD_DAYS,
    peak_offset: int = FESTIVAL_PEAK_OFFSET,
    decay_days: int = FESTIVAL_DECAY_DAYS,
) -> np.ndarray:
    """0->1->0 ramp: builds up to the festival, peaks a couple of days
    before it, then decays. Mirrors the synthetic generator's ramp exactly."""
    days_diff = np.asarray(days_diff, dtype=float)
    ramp = np.zeros_like(days_diff)
    building = (days_diff >= -build_days) & (days_diff <= peak_offset)
    ramp[building] = (days_diff[building] + build_days) / (peak_offset + build_days)
    decaying = (days_diff > peak_offset) & (days_diff <= decay_days)
    ramp[decaying] = 1 - (days_diff[decaying] - peak_offset) / (decay_days - peak_offset)
    return np.clip(ramp, 0, 1)
