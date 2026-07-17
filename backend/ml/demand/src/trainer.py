from __future__ import annotations

import numpy as np
from sklearn.ensemble import (
    GradientBoostingRegressor,
    HistGradientBoostingRegressor,
    RandomForestRegressor,
)
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import TimeSeriesSplit

import lightgbm as lgb
import xgboost as xgb
from catboost import CatBoostRegressor

from .utils import RANDOM_SEED, TARGET_COL, get_logger

logger = get_logger("trainer")

N_CV_SPLITS = 3

MODEL_GRIDS: dict[str, list[dict]] = {
    "XGBoost": [
        {"n_estimators": 300, "max_depth": 5, "learning_rate": 0.06, "subsample": 0.9, "colsample_bytree": 0.9},
        {"n_estimators": 200, "max_depth": 6, "learning_rate": 0.08, "subsample": 1.0, "colsample_bytree": 1.0},
    ],
    "LightGBM": [
        {"n_estimators": 300, "max_depth": -1, "learning_rate": 0.06, "num_leaves": 31},
        {"n_estimators": 200, "max_depth": 8, "learning_rate": 0.08, "num_leaves": 63},
    ],
    "CatBoost": [
        {"iterations": 350, "depth": 6, "learning_rate": 0.06},
        {"iterations": 250, "depth": 8, "learning_rate": 0.08},
    ],
    "RandomForest": [
        {"n_estimators": 200, "max_depth": 12, "min_samples_leaf": 3},
        {"n_estimators": 300, "max_depth": 16, "min_samples_leaf": 2},
    ],
    "GradientBoosting": [
        {"n_estimators": 150, "max_depth": 4, "learning_rate": 0.08, "subsample": 0.9},
    ],
    "HistGradientBoosting": [
        {"max_iter": 300, "max_depth": 8, "learning_rate": 0.07, "l2_regularization": 0.1},
    ],
}


def _build(name: str, params: dict):
    if name == "XGBoost":
        return xgb.XGBRegressor(
            **params, random_state=RANDOM_SEED, n_jobs=-1,
            objective="reg:squarederror", tree_method="hist",
        )
    if name == "LightGBM":
        return lgb.LGBMRegressor(**params, random_state=RANDOM_SEED, n_jobs=-1, verbosity=-1)
    if name == "CatBoost":
        return CatBoostRegressor(**params, random_seed=RANDOM_SEED, verbose=False, loss_function="RMSE")
    if name == "RandomForest":
        return RandomForestRegressor(**params, random_state=RANDOM_SEED, n_jobs=-1)
    if name == "GradientBoosting":
        return GradientBoostingRegressor(**params, random_state=RANDOM_SEED)
    if name == "HistGradientBoosting":
        return HistGradientBoostingRegressor(**params, random_state=RANDOM_SEED)
    raise ValueError(f"Unknown model name: {name}")


def _rmse(y_true, y_pred) -> float:
    return float(np.sqrt(mean_squared_error(y_true, y_pred)))


class ModelTrainer:
    """Expanding-window cross-validated hyperparameter search, followed by a
    final fit of the winning config on the entire train+val window."""

    def __init__(self, feature_cols: list[str]) -> None:
        self.feature_cols = feature_cols

    def _cv_score(self, name: str, params: dict, X, y) -> float:
        tscv = TimeSeriesSplit(n_splits=N_CV_SPLITS)
        fold_rmses = []
        for train_idx, val_idx in tscv.split(X):
            model = _build(name, params)
            X_tr, X_val = X.iloc[train_idx], X.iloc[val_idx]
            y_tr, y_val = y.iloc[train_idx], y.iloc[val_idx]
            if name == "XGBoost":
                model.fit(X_tr, y_tr, eval_set=[(X_val, y_val)], verbose=False)
            elif name == "LightGBM":
                model.fit(X_tr, y_tr, eval_set=[(X_val, y_val)], callbacks=[lgb.early_stopping(50, verbose=False)])
            elif name == "CatBoost":
                model.fit(X_tr, y_tr, eval_set=(X_val, y_val), use_best_model=True, early_stopping_rounds=50)
            else:
                model.fit(X_tr, y_tr)
            fold_rmses.append(_rmse(y_val, model.predict(X_val)))
        return float(np.mean(fold_rmses))

    def train_all(self, train_val_df) -> list[dict]:
        X = train_val_df[self.feature_cols]
        y = train_val_df[TARGET_COL]

        results = []
        for name, grid in MODEL_GRIDS.items():
            logger.info("Cross-validating %s (%d candidate configs, %d expanding-window folds)...",
                        name, len(grid), N_CV_SPLITS)
            best_params, best_cv_rmse = None, None
            for params in grid:
                try:
                    cv_rmse = self._cv_score(name, params, X, y)
                except Exception as exc:  # pragma: no cover
                    logger.warning("%s candidate %s failed: %s", name, params, exc)
                    continue
                logger.info("  %s %s -> CV RMSE=%.4f", name, params, cv_rmse)
                if best_cv_rmse is None or cv_rmse < best_cv_rmse:
                    best_cv_rmse, best_params = cv_rmse, params

            if best_params is None:
                logger.warning("%s: all candidates failed, skipping", name)
                continue

            final_model = _build(name, best_params)
            final_model.fit(X, y)
            results.append({"name": name, "model": final_model, "cv_rmse": best_cv_rmse, "params": best_params})

        return results
