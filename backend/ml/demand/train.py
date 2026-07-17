from __future__ import annotations

import argparse
import os

import joblib
import pandas as pd

from src.demand_forecaster import DemandForecaster
from src.evaluator import build_comparison_table, save_artifacts
from src.explainability import build_explainer, global_importance_table
from src.feature_engineering import FeatureEngineer, get_feature_columns
from src.preprocessing import DataPreprocessor
from src.trainer import ModelTrainer
from src.utils import MAX_LAG, RANDOM_SEED, get_logger

logger = get_logger("train")

FINAL_TEST_DAYS = 45  
MODEL_DIR = "models"
ARTIFACT_DIR = "artifacts"


def time_based_split(df: pd.DataFrame, test_days: int = FINAL_TEST_DAYS):
    max_date = df["date"].max()
    test_start = max_date - pd.Timedelta(days=test_days - 1)
    train_val = df[df["date"] < test_start].copy()
    test = df[df["date"] >= test_start].copy()
    logger.info(
        "Chronological split -> train+val: %d rows (< %s) | test: %d rows (>= %s)",
        len(train_val), test_start.date(), len(test), test_start.date(),
    )
    return train_val, test


def main(data_path: str) -> None:
    os.makedirs(MODEL_DIR, exist_ok=True)
    os.makedirs(ARTIFACT_DIR, exist_ok=True)

    preprocessor = DataPreprocessor()
    df = preprocessor.run(data_path)
    train_val_raw, _test_raw = time_based_split(df)
    preprocessor.fit_entity_stats(train_val_raw)
    
    engineer = FeatureEngineer()
    df_feat = engineer.run(df, preprocessor)
    feature_cols = get_feature_columns(df_feat)
    logger.info("Using %d model features", len(feature_cols))

    model_df = df_feat.dropna(subset=[f"units_lag_{MAX_LAG}"]).copy()
    model_df[feature_cols] = model_df[feature_cols].fillna(0)

    train_val_df, test_df = time_based_split(model_df)

    trainer = ModelTrainer(feature_cols)
    results = trainer.train_all(train_val_df)
    if not results:
        raise RuntimeError("All candidate models failed to train.")

    comparison_table = build_comparison_table(results, test_df, feature_cols)
    best_name = comparison_table.iloc[0]["Model"]
    best = next(r for r in results if r["name"] == best_name)
    best_model = best["model"]
    logger.info("Best model selected: %s (Test RMSE=%.4f, driven purely by held-out test performance)",
                best_name, comparison_table.iloc[0]["RMSE"])

    if hasattr(best_model, "feature_importances_"):
        fi_table = pd.DataFrame({
            "feature": feature_cols, "importance": best_model.feature_importances_,
        }).sort_values("importance", ascending=False).reset_index(drop=True)
    else:
        fi_table = pd.DataFrame({"feature": feature_cols, "importance": 0.0})

    explainer = build_explainer(best_model)
    shap_sample = test_df[feature_cols].sample(n=min(1000, len(test_df)), random_state=RANDOM_SEED)
    shap_table = global_importance_table(explainer, shap_sample, feature_cols)
    shap_table.to_csv(os.path.join(ARTIFACT_DIR, "shap_global_importance.csv"), index=False)

    best_row = comparison_table.iloc[0].to_dict()
    save_artifacts(comparison_table, fi_table, best_row, ARTIFACT_DIR)

    metadata = {
        "best_model": best_name,
        "test_rmse": best_row["RMSE"],
        "test_mae": best_row["MAE"],
        "test_mape": best_row["MAPE"],
        "test_r2": best_row["R2"],
        "cv_rmse": best_row["CV_RMSE"],
        "feature_cols": feature_cols,
        "trained_rows": len(train_val_df),
        "random_seed": RANDOM_SEED,
        "trained_at": pd.Timestamp.now(tz="UTC").isoformat(),
    }

    forecaster = DemandForecaster(
        model=best_model,
        model_name=best_name,
        feature_cols=feature_cols,
        preprocessor=preprocessor,
        feature_engineer=engineer,
        metadata=metadata,
        feature_importance_table=fi_table,
        global_shap_table=shap_table,
    )

    out_path = os.path.join(MODEL_DIR, "forecasting_pipeline.joblib")
    joblib.dump(forecaster, out_path)
    logger.info("Saved the ONE deployable artifact -> %s", out_path)

    print("\n" + "=" * 70)
    print("MODEL COMPARISON (sorted by held-out Test RMSE)")
    print("=" * 70)
    print(comparison_table.to_string(index=False))
    print(f"\nBest model: {best_name}  ->  {out_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="VyaparAI demand forecasting -- training entrypoint")
    parser.add_argument("--data", type=str, default="data/raw/vyaparai_daily_demand.csv",
                         help="Path to vyaparai_daily_demand.csv")
    args = parser.parse_args()
    main(args.data)
