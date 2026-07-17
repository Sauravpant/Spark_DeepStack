from __future__ import annotations

import json
import os

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from .utils import TARGET_COL, get_logger

logger = get_logger("evaluator")


def evaluate(y_true, y_pred) -> dict:
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.clip(np.asarray(y_pred, dtype=float), 0, None)  # demand can't be negative
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mae = float(mean_absolute_error(y_true, y_pred))
    nonzero = y_true != 0
    mape = (
        float(np.mean(np.abs((y_true[nonzero] - y_pred[nonzero]) / y_true[nonzero])) * 100)
        if nonzero.any() else float("nan")
    )
    r2 = float(r2_score(y_true, y_pred))
    return {"RMSE": rmse, "MAE": mae, "MAPE": mape, "R2": r2}


def build_comparison_table(results: list[dict], test_df: pd.DataFrame, feature_cols: list[str]) -> pd.DataFrame:
    rows = []
    for r in results:
        preds = r["model"].predict(test_df[feature_cols])
        metrics = evaluate(test_df[TARGET_COL].values, preds)
        rows.append({"Model": r["name"], "CV_RMSE": r["cv_rmse"], **metrics})
    return pd.DataFrame(rows).sort_values("RMSE").reset_index(drop=True)


def save_artifacts(
    comparison_table: pd.DataFrame,
    feature_importance_table: pd.DataFrame,
    best_row: dict,
    artifact_dir: str = "artifacts",
) -> None:
    os.makedirs(artifact_dir, exist_ok=True)
    comparison_table.to_csv(os.path.join(artifact_dir, "model_comparison.csv"), index=False)
    comparison_table.to_csv(os.path.join(artifact_dir, "validation_results.csv"), index=False)
    feature_importance_table.to_csv(os.path.join(artifact_dir, "feature_importance.csv"), index=False)

    metrics = {
        "best_model": best_row["Model"],
        "test_rmse": best_row["RMSE"],
        "test_mae": best_row["MAE"],
        "test_mape": best_row["MAPE"],
        "test_r2": best_row["R2"],
        "cv_rmse": best_row["CV_RMSE"],
    }
    with open(os.path.join(artifact_dir, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    logger.info("Artifacts saved to '%s/'", artifact_dir)
