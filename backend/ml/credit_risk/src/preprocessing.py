
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List

import pandas as pd

from .config import FEATURE_COLUMNS, INTEGER_FEATURES, NON_NEGATIVE_FEATURES, UNIT_RATIO_FEATURES

logger = logging.getLogger(__name__)


class FeatureValidationError(ValueError):
    """Raised when caller-supplied features cannot be safely used for prediction."""


@dataclass
class CreditRiskPreprocessor:

    feature_columns: List[str] = field(default_factory=lambda: list(FEATURE_COLUMNS))
    medians_: Dict[str, float] = field(default_factory=dict)
    lower_bounds_: Dict[str, float] = field(default_factory=dict)
    upper_bounds_: Dict[str, float] = field(default_factory=dict)
    is_fitted: bool = False

    # ------------------------------------------------------------------
    # Training-time helpers
    # ------------------------------------------------------------------
    @staticmethod
    def remove_duplicates(df: pd.DataFrame) -> pd.DataFrame:
        """Drop exact duplicate rows. Training-time only - never used at inference."""
        before = len(df)
        df = df.drop_duplicates().reset_index(drop=True)
        removed = before - len(df)
        if removed:
            logger.info("Removed %d exact duplicate row(s) (%.2f%% of data).", removed, 100 * removed / before)
        return df

    def fit(self, df: pd.DataFrame) -> "CreditRiskPreprocessor":
        """Learn imputation medians and outlier-clipping bounds from TRAINING data only."""
        self._validate_columns(df)
        working = df[self.feature_columns].apply(pd.to_numeric, errors="coerce")

        self.medians_ = working.median(numeric_only=True).to_dict()
        self.lower_bounds_ = working.quantile(0.001).to_dict()
        self.upper_bounds_ = working.quantile(0.999).to_dict()

        self.is_fitted = True
        logger.info(
            "CreditRiskPreprocessor fitted on %d rows across %d features.", len(df), len(self.feature_columns)
        )
        return self

    # ------------------------------------------------------------------
    # Inference / transform-time
    # ------------------------------------------------------------------
    def _validate_columns(self, df: pd.DataFrame) -> None:
        missing = [c for c in self.feature_columns if c not in df.columns]
        if missing:
            raise FeatureValidationError(f"Missing required feature column(s): {missing}")

    def transform(self, df: pd.DataFrame, clip_outliers: bool = True) -> pd.DataFrame:
        """Validate, coerce and clean a feature dataframe. Safe for 1..N rows.

        This is the single function that both the training pipeline and the
        `CreditRiskPredictor` call - guaranteeing identical logic is applied
        in training and in production.
        """
        if not self.is_fitted:
            raise RuntimeError("CreditRiskPreprocessor.transform() called before fit().")

        self._validate_columns(df)
        out = df[self.feature_columns].copy()


        for col in self.feature_columns:
            out[col] = pd.to_numeric(out[col], errors="coerce")

        n_missing = int(out.isna().sum().sum())
        if n_missing:
            logger.warning("Imputing %d missing/invalid value(s) using training medians.", n_missing)
            out = out.fillna(value=self.medians_)
            out = out.fillna(0.0)  # ultimate fallback if a median itself was unavailable

        for col in NON_NEGATIVE_FEATURES:
            if col in out.columns:
                negative_mask = out[col] < 0
                if negative_mask.any():
                    logger.warning("Clipping %d negative value(s) in '%s' to 0.", int(negative_mask.sum()), col)
                out[col] = out[col].clip(lower=0)

        for col in UNIT_RATIO_FEATURES:
            if col in out.columns:
                out[col] = out[col].clip(lower=0.0, upper=1.0)

        if clip_outliers:
            for col in self.feature_columns:
                lo = self.lower_bounds_.get(col)
                hi = self.upper_bounds_.get(col)
                if lo is not None and hi is not None and hi > lo:
                    out[col] = out[col].clip(lower=lo, upper=hi)

        for col in INTEGER_FEATURES:
            if col in out.columns:
                out[col] = out[col].round()

        out = out[self.feature_columns]  # enforce final, canonical column order
        return out.astype("float64")

    def transform_single(self, feature_dict: Dict[str, Any]) -> pd.DataFrame:

        missing = [c for c in self.feature_columns if c not in feature_dict]
        if missing:
            raise FeatureValidationError(
                f"Missing required feature(s) for prediction: {missing}. "
                f"Expected exactly: {self.feature_columns}"
            )
        extra = [k for k in feature_dict if k not in self.feature_columns]
        if extra:
            logger.warning("Ignoring unexpected/extra field(s) supplied at inference: %s", extra)

        row = {c: feature_dict[c] for c in self.feature_columns}
        df = pd.DataFrame([row])
        return self.transform(df)
