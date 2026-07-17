
from __future__ import annotations

import numpy as np
import pandas as pd

from .utils import GROUP_COLS, get_logger

logger = get_logger("preprocessing")

CATEGORICAL_COLS = ["shop_id", "location_type", "category"]
DROP_COLS = ["revenue"]


class DataPreprocessor:
    """Fitted state (label_encoders, entity_stats) is plain-dict based so the
    whole object is trivially picklable inside the single deployable
    DemandForecaster artifact -- no external encoder files required.
    """

    def __init__(self) -> None:
        self.label_encoders: dict[str, dict[str, int]] = {}
        self.entity_stats: dict[str, dict] = {}

    # -- loading / cleaning --------------------------------------------------
    def load(self, path: str) -> pd.DataFrame:
        logger.info("Loading data from %s", path)
        df = pd.read_csv(path, parse_dates=["date"])
        for col in DROP_COLS:
            if col in df.columns:
                df = df.drop(columns=[col])
        logger.info("Loaded %d rows, %d columns (revenue dropped as a target-derived leak)", *df.shape)
        return df

    def clean(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.sort_values(GROUP_COLS + ["date"]).reset_index(drop=True)
        n_missing = df.isna().sum().sum()
        if n_missing:
            logger.warning("Found %d missing values -> filling", n_missing)
            num_cols = df.select_dtypes(include=[np.number]).columns
            df[num_cols] = df[num_cols].fillna(0)
            cat_cols = df.select_dtypes(include=["object"]).columns
            df[cat_cols] = df[cat_cols].fillna("unknown")
        else:
            logger.info("No missing values found")
        return df

    # -- categorical encoding -------------------------------------------------
    def fit_categoricals(self, df: pd.DataFrame) -> pd.DataFrame:
        for col in CATEGORICAL_COLS:
            if col not in df.columns:
                continue
            classes = sorted(df[col].astype(str).unique())
            mapping = {cls: i for i, cls in enumerate(classes)}
            self.label_encoders[col] = mapping
            df[col + "_enc"] = df[col].astype(str).map(mapping).astype(int)
        return df

    def transform_categoricals(self, df: pd.DataFrame) -> pd.DataFrame:
        """Inference-safe transform: unseen categories map to -1 instead of
        raising, so a new shop/category never crashes the API."""
        df = df.copy()
        for col, mapping in self.label_encoders.items():
            if col not in df.columns:
                continue
            df[col + "_enc"] = df[col].astype(str).map(mapping).fillna(-1).astype(int)
        return df

    # -- entity-level historical aggregates (fit on TRAIN split only) --------
    def fit_entity_stats(self, train_df: pd.DataFrame) -> None:
        self.entity_stats["shop_avg_demand"] = train_df.groupby("shop_id")["units_sold"].mean().to_dict()
        self.entity_stats["category_avg_demand"] = train_df.groupby("category")["units_sold"].mean().to_dict()
        self.entity_stats["shop_category_avg_demand"] = (
            train_df.groupby(["shop_id", "category"])["units_sold"].mean().to_dict()
        )
        self.entity_stats["global_avg_demand"] = float(train_df["units_sold"].mean())
        logger.info(
            "Fit entity stats on %d train rows (shops=%d, categories=%d)",
            len(train_df), len(self.entity_stats["shop_avg_demand"]), len(self.entity_stats["category_avg_demand"]),
        )

    # -- orchestration --------------------------------------------------------
    def run(self, path: str) -> pd.DataFrame:
        df = self.load(path)
        df = self.clean(df)
        df = self.fit_categoricals(df)
        logger.info("Preprocessing complete: %d rows", len(df))
        return df
