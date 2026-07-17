"""
trainer.py - VyaparAI Credit Risk training pipeline orchestration.

This module owns the full journey from raw CSV to the single deployable
`models/credit_risk_pipeline.joblib` artifact:

    1.  Load + validate the raw dataset, drop exact duplicates.
    2.  Stratified split into train / validation / test.
    3.  Fit `CreditRiskPreprocessor` on train only.
    4.  Train every candidate model under two imbalance strategies
        (baseline, class-weighted) and rank them on the validation set.
    5.  As a CONTROLLED EXPERIMENT ONLY, try resampling (SMOTE /
        RandomOverSampler) on the winning model family; adopt it only if it
        objectively outperforms the class-weighted/baseline winner.
    6.  Calibrate the winning model (Platt vs. Isotonic, chosen on a
        dedicated calibration split) and search for the F1-optimal decision
        threshold on a disjoint validation split.
    7.  Report final, unbiased metrics on the untouched test set.
    8.  Build a SHAP explainer over the (uncalibrated) winning base model and
        compute global feature importance.
    9.  Bundle everything into one `CreditRiskPredictor` and serialize it.
   10.  Write every artifact required by the spec to `artifacts/`.

Every candidate model is optional at the *library* level (CatBoost, XGBoost,
LightGBM, imbalanced-learn) - if a package is not installed, that candidate
is simply skipped with a warning rather than crashing the whole pipeline.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Dict, Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import (
    ExtraTreesClassifier,
    HistGradientBoostingClassifier,
    RandomForestClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss
from sklearn.model_selection import train_test_split

from .config import (
    ARTIFACTS_DIR,
    CALIBRATION_METHODS,
    FEATURE_COLUMNS,
    MODEL_ARTIFACT_PATH,
    MODEL_VERSION,
    RANDOM_SEED,
    RAW_DATA_PATH,
    SHAP_BACKGROUND_SAMPLE_SIZE,
    SHAP_GLOBAL_IMPORTANCE_SAMPLE_SIZE,
    TARGET_COLUMN,
    TEST_SIZE,
    VAL_SIZE,
)
from .credit_risk_predictor import CreditRiskPredictor
from .evaluator import (
    calibration_curve_points,
    classification_metrics,
    confusion_matrix_dict,
    find_optimal_threshold,
    ranking_key,
)
from .explainability import ShapExplainer
from .preprocessing import CreditRiskPreprocessor
from .utils import get_logger, save_json, set_global_seed, timer

# ---------------------------------------------------------------------------
# Optional third-party model libraries - degrade gracefully if not installed
# ---------------------------------------------------------------------------
try:
    from catboost import CatBoostClassifier

    CATBOOST_AVAILABLE = True
except ImportError:  # pragma: no cover
    CATBOOST_AVAILABLE = False

try:
    from xgboost import XGBClassifier

    XGBOOST_AVAILABLE = True
except ImportError:  # pragma: no cover
    XGBOOST_AVAILABLE = False

try:
    from lightgbm import LGBMClassifier

    LIGHTGBM_AVAILABLE = True
except ImportError:  # pragma: no cover
    LIGHTGBM_AVAILABLE = False

try:
    from imblearn.ensemble import BalancedRandomForestClassifier
    from imblearn.over_sampling import SMOTE, RandomOverSampler

    IMBLEARN_AVAILABLE = True
except ImportError:  # pragma: no cover
    IMBLEARN_AVAILABLE = False


_module_logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------
def load_and_validate_data(path: Path, logger: logging.Logger) -> pd.DataFrame:
    """Load the raw CSV, validate its schema, and drop exact duplicates.

    Raises
    ------
    FileNotFoundError
        If the CSV does not exist at `path`.
    ValueError
        If required columns are missing or the target contains nulls.
    """
    if not path.exists():
        raise FileNotFoundError(
            f"Training data not found at {path}. Run `python scripts/generate_credit_data.py` "
            f"first, or place your own credit_risk_dataset.csv at that path."
        )

    df = pd.read_csv(path)
    required = FEATURE_COLUMNS + [TARGET_COLUMN]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset is missing required column(s): {missing}")

    if df[TARGET_COLUMN].isna().any():
        raise ValueError("Target column 'is_risk' contains missing values; cannot train on an incomplete target.")

    df[TARGET_COLUMN] = df[TARGET_COLUMN].astype(int)
    df = CreditRiskPreprocessor.remove_duplicates(df)

    prevalence = df[TARGET_COLUMN].mean()
    logger.info("Loaded %d rows. Target prevalence (is_risk=1): %.2f%%", len(df), prevalence * 100)
    if prevalence < 0.03 or prevalence > 0.5:
        logger.warning("Unusual class prevalence detected (%.2f%%) - double-check the data source.", prevalence * 100)

    return df


# ---------------------------------------------------------------------------
# Candidate model factories
# ---------------------------------------------------------------------------
def _build_model_factories(pos_weight: float) -> Dict[str, Dict[str, Optional[Callable[[], Any]]]]:
    """Return {model_name: {strategy_name: zero-arg factory}} for every candidate.

    `strategy_name` is one of "baseline" or "class_weight". A value of `None`
    means that strategy is not supported/meaningful for that model family.
    """
    factories: Dict[str, Dict[str, Optional[Callable[[], Any]]]] = {}

    factories["LogisticRegression"] = {
        "baseline": lambda: LogisticRegression(max_iter=2000, random_state=RANDOM_SEED),
        "class_weight": lambda: LogisticRegression(max_iter=2000, random_state=RANDOM_SEED, class_weight="balanced"),
    }
    factories["RandomForest"] = {
        "baseline": lambda: RandomForestClassifier(n_estimators=400, n_jobs=-1, random_state=RANDOM_SEED),
        "class_weight": lambda: RandomForestClassifier(
            n_estimators=400, n_jobs=-1, random_state=RANDOM_SEED, class_weight="balanced"
        ),
    }
    factories["ExtraTrees"] = {
        "baseline": lambda: ExtraTreesClassifier(n_estimators=400, n_jobs=-1, random_state=RANDOM_SEED),
        "class_weight": lambda: ExtraTreesClassifier(
            n_estimators=400, n_jobs=-1, random_state=RANDOM_SEED, class_weight="balanced"
        ),
    }
    factories["HistGradientBoosting"] = {
        "baseline": lambda: HistGradientBoostingClassifier(random_state=RANDOM_SEED),
        "class_weight": lambda: HistGradientBoostingClassifier(random_state=RANDOM_SEED, class_weight="balanced"),
    }

    if CATBOOST_AVAILABLE:
        factories["CatBoost"] = {
            "baseline": lambda: CatBoostClassifier(
                iterations=600, depth=6, learning_rate=0.05, random_seed=RANDOM_SEED, verbose=False
            ),
            "class_weight": lambda: CatBoostClassifier(
                iterations=600,
                depth=6,
                learning_rate=0.05,
                random_seed=RANDOM_SEED,
                verbose=False,
                auto_class_weights="Balanced",
            ),
        }

    if XGBOOST_AVAILABLE:
        factories["XGBoost"] = {
            "baseline": lambda: XGBClassifier(
                n_estimators=500,
                max_depth=6,
                learning_rate=0.05,
                random_state=RANDOM_SEED,
                eval_metric="logloss",
                n_jobs=-1,
            ),
            "class_weight": lambda: XGBClassifier(
                n_estimators=500,
                max_depth=6,
                learning_rate=0.05,
                random_state=RANDOM_SEED,
                eval_metric="logloss",
                n_jobs=-1,
                scale_pos_weight=pos_weight,
            ),
        }

    if LIGHTGBM_AVAILABLE:
        factories["LightGBM"] = {
            "baseline": lambda: LGBMClassifier(
                n_estimators=500, learning_rate=0.05, random_state=RANDOM_SEED, n_jobs=-1, verbosity=-1
            ),
            "class_weight": lambda: LGBMClassifier(
                n_estimators=500,
                learning_rate=0.05,
                random_state=RANDOM_SEED,
                n_jobs=-1,
                class_weight="balanced",
                verbosity=-1,
            ),
        }

    if IMBLEARN_AVAILABLE:
        factories["BalancedRandomForest"] = {
            "baseline": lambda: BalancedRandomForestClassifier(n_estimators=400, random_state=RANDOM_SEED, n_jobs=-1),
            "class_weight": None,  # BalancedRandomForest already balances via sampling
        }

    return factories


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------
def run_training_pipeline(data_path: Optional[Path] = None, logger: Optional[logging.Logger] = None) -> Path:
    """Run the end-to-end training pipeline and return the path to the
    serialized `credit_risk_pipeline.joblib` artifact.
    """
    logger = logger or get_logger("trainer")
    set_global_seed(RANDOM_SEED)
    data_path = data_path or RAW_DATA_PATH

    logger.info(
        "Optional libraries available -> CatBoost: %s | XGBoost: %s | LightGBM: %s | imbalanced-learn: %s",
        CATBOOST_AVAILABLE, XGBOOST_AVAILABLE, LIGHTGBM_AVAILABLE, IMBLEARN_AVAILABLE,
    )

    # ------------------------------------------------------------------
    # 1. Load data
    # ------------------------------------------------------------------
    with timer(logger, "Loading and validating raw data"):
        df = load_and_validate_data(data_path, logger)

    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    # ------------------------------------------------------------------
    # 2. Stratified train / validation / test split
    # ------------------------------------------------------------------
    with timer(logger, "Splitting data (stratified train/val/test)"):
        X_trainval, X_test, y_trainval, y_test = train_test_split(
            X, y, test_size=TEST_SIZE, stratify=y, random_state=RANDOM_SEED
        )
        val_relative_size = VAL_SIZE / (1 - TEST_SIZE)
        X_train, X_val, y_train, y_val = train_test_split(
            X_trainval, y_trainval, test_size=val_relative_size, stratify=y_trainval, random_state=RANDOM_SEED
        )
    logger.info(
        "Split sizes -> train: %d | val: %d | test: %d (prevalence train=%.2f%% val=%.2f%% test=%.2f%%)",
        len(X_train), len(X_val), len(X_test),
        y_train.mean() * 100, y_val.mean() * 100, y_test.mean() * 100,
    )

    # ------------------------------------------------------------------
    # 3. Fit preprocessor on TRAIN ONLY, then transform every split
    # ------------------------------------------------------------------
    with timer(logger, "Fitting preprocessor"):
        preprocessor = CreditRiskPreprocessor()
        preprocessor.fit(X_train)
        X_train_t = preprocessor.transform(X_train)
        X_val_t = preprocessor.transform(X_val)
        X_test_t = preprocessor.transform(X_test)

    pos_weight = float((y_train == 0).sum()) / max(float((y_train == 1).sum()), 1.0)
    logger.info("Class imbalance ratio (neg/pos) on train: %.3f", pos_weight)

    # ------------------------------------------------------------------
    # 4. Train + rank every candidate model x imbalance-strategy
    # ------------------------------------------------------------------
    factories = _build_model_factories(pos_weight)
    comparison_rows = []
    fitted_cache: Dict[tuple, Any] = {}

    with timer(logger, "Training and comparing candidate models"):
        for model_name, strategies in factories.items():
            for strategy_name, factory in strategies.items():
                if factory is None:
                    continue
                logger.info("Training %s [%s] ...", model_name, strategy_name)
                try:
                    estimator = factory()
                    estimator.fit(X_train_t, y_train)
                except Exception as exc:
                    logger.error("Skipping %s [%s] due to training error: %s", model_name, strategy_name, exc)
                    continue

                val_proba = estimator.predict_proba(X_val_t)[:, 1]
                threshold, _ = find_optimal_threshold(y_val.values, val_proba)
                metrics = classification_metrics(y_val.values, val_proba, threshold)

                row = {"model": model_name, "strategy": strategy_name, **metrics}
                comparison_rows.append(row)
                fitted_cache[(model_name, strategy_name)] = estimator
                logger.info(
                    "  -> ROC AUC=%.4f | PR AUC=%.4f | F1=%.4f | Brier=%.4f | MCC=%.4f",
                    metrics["roc_auc"], metrics["pr_auc"], metrics["f1"], metrics["brier_score"], metrics["mcc"],
                )

    if not comparison_rows:
        raise RuntimeError("No candidate model trained successfully. Check installed dependencies and logs above.")

    comparison_df = pd.DataFrame(comparison_rows).sort_values(
        by=["roc_auc", "pr_auc", "f1"], ascending=False
    ).reset_index(drop=True)
    comparison_df.to_csv(ARTIFACTS_DIR / "model_comparison.csv", index=False)

    best_row = min(comparison_rows, key=ranking_key)
    best_model_name, best_strategy = best_row["model"], best_row["strategy"]
    best_estimator = fitted_cache[(best_model_name, best_strategy)]
    logger.info(
        "Leaderboard winner (pre-resampling-experiment): %s [%s] "
        "(ROC AUC=%.4f, PR AUC=%.4f, F1=%.4f)",
        best_model_name, best_strategy, best_row["roc_auc"], best_row["pr_auc"], best_row["f1"],
    )

    # ------------------------------------------------------------------
    # 5. Resampling as a CONTROLLED EXPERIMENT ONLY on the winning model family.
    #    Adopted ONLY if it objectively beats the class-weighted/baseline winner.
    # ------------------------------------------------------------------
    if IMBLEARN_AVAILABLE and best_model_name in factories and factories[best_model_name].get("baseline"):
        with timer(logger, "Resampling experiments (SMOTE / RandomOverSampler) - controlled comparison only"):
            resampling_rows = []
            samplers = {
                "SMOTE": SMOTE(random_state=RANDOM_SEED),
                "RandomOverSampler": RandomOverSampler(random_state=RANDOM_SEED),
            }
            for sampler_name, sampler in samplers.items():
                try:
                    X_res, y_res = sampler.fit_resample(X_train_t, y_train)
                    estimator = factories[best_model_name]["baseline"]()
                    estimator.fit(X_res, y_res)
                    val_proba = estimator.predict_proba(X_val_t)[:, 1]
                    threshold, _ = find_optimal_threshold(y_val.values, val_proba)
                    metrics = classification_metrics(y_val.values, val_proba, threshold)
                    row = {"model": best_model_name, "strategy": sampler_name, **metrics}
                    resampling_rows.append(row)
                    fitted_cache[(best_model_name, sampler_name)] = estimator
                    logger.info(
                        "  -> %s: ROC AUC=%.4f | PR AUC=%.4f | F1=%.4f",
                        sampler_name, metrics["roc_auc"], metrics["pr_auc"], metrics["f1"],
                    )
                except Exception as exc:
                    logger.warning("Resampling experiment '%s' failed: %s", sampler_name, exc)

            if resampling_rows:
                pd.DataFrame(resampling_rows).to_csv(ARTIFACTS_DIR / "resampling_experiments.csv", index=False)
                best_resampling = min(resampling_rows, key=ranking_key)
                if ranking_key(best_resampling) < ranking_key(best_row):
                    logger.info(
                        "Resampling strategy '%s' outperformed '%s'; adopting it as the final strategy.",
                        best_resampling["strategy"], best_strategy,
                    )
                    best_row = best_resampling
                    best_strategy = best_resampling["strategy"]
                    best_estimator = fitted_cache[(best_model_name, best_strategy)]
                else:
                    logger.info(
                        "No resampling strategy beat '%s' [%s]; keeping the original winner.",
                        best_model_name, best_strategy,
                    )
    else:
        logger.info("Skipping resampling experiments (imbalanced-learn not installed or model unsupported).")

    # ------------------------------------------------------------------
    # 6. Calibration (Platt vs. Isotonic) + F1-optimal threshold search
    #    on two DISJOINT halves of the validation set, so neither step
    #    contaminates the other.
    # ------------------------------------------------------------------
    with timer(logger, "Calibrating probabilities and optimizing decision threshold"):
        calib_idx, thresh_idx = train_test_split(
            np.arange(len(X_val_t)), test_size=0.5, stratify=y_val, random_state=RANDOM_SEED
        )
        X_val_calib, y_val_calib = X_val_t.iloc[calib_idx], y_val.iloc[calib_idx]
        X_val_thresh, y_val_thresh = X_val_t.iloc[thresh_idx], y_val.iloc[thresh_idx]

        calibration_candidates: Dict[str, Any] = {}
        calibration_briers: Dict[str, float] = {}
        for method in CALIBRATION_METHODS:
            try:
                calibrated = CalibratedClassifierCV(best_estimator, method=method, cv="prefit")
                calibrated.fit(X_val_calib, y_val_calib)
                proba_thresh = calibrated.predict_proba(X_val_thresh)[:, 1]
                brier = brier_score_loss(y_val_thresh, proba_thresh)
                calibration_candidates[method] = calibrated
                calibration_briers[method] = float(brier)
                logger.info("  -> Calibration '%s': Brier score on holdout = %.5f", method, brier)
            except Exception as exc:
                logger.warning("Calibration method '%s' failed: %s", method, exc)

        if not calibration_candidates:
            logger.warning("All calibration methods failed; serving raw (uncalibrated) model probabilities.")
            best_calibration_method = "none"
            calibrated_model = best_estimator
        else:
            best_calibration_method = min(calibration_briers, key=calibration_briers.get)
            calibrated_model = calibration_candidates[best_calibration_method]
        logger.info("Selected calibration method: %s", best_calibration_method)

        proba_val_thresh = calibrated_model.predict_proba(X_val_thresh)[:, 1]
        optimal_threshold, f1_at_threshold = find_optimal_threshold(y_val_thresh.values, proba_val_thresh)
        logger.info("Optimal (F1-maximizing) threshold: %.4f (F1=%.4f on threshold-search holdout)",
                    optimal_threshold, f1_at_threshold)

        calib_mean_pred, calib_frac_pos = calibration_curve_points(y_val_thresh.values, proba_val_thresh)
        calibration_metrics_df = pd.DataFrame(
            {
                "method": best_calibration_method,
                "mean_predicted_probability": calib_mean_pred,
                "fraction_of_positives": calib_frac_pos,
                "brier_score": calibration_briers.get(best_calibration_method, np.nan),
            }
        )
        calibration_metrics_df.to_csv(ARTIFACTS_DIR / "calibration_metrics.csv", index=False)

    # ------------------------------------------------------------------
    # 7. Final, unbiased evaluation on the untouched TEST set
    # ------------------------------------------------------------------
    with timer(logger, "Final evaluation on the held-out test set"):
        proba_test = calibrated_model.predict_proba(X_test_t)[:, 1]
        test_metrics = classification_metrics(y_test.values, proba_test, optimal_threshold)
        test_confusion = confusion_matrix_dict(y_test.values, proba_test, optimal_threshold)

        pd.DataFrame([{"split": "validation_threshold_holdout", **classification_metrics(
            y_val_thresh.values, proba_val_thresh, optimal_threshold)},
            {"split": "test", **test_metrics}]).to_csv(ARTIFACTS_DIR / "validation_results.csv", index=False)
        pd.DataFrame([test_confusion]).to_csv(ARTIFACTS_DIR / "confusion_matrix.csv", index=False)

        logger.info(
            "TEST SET -> ROC AUC=%.4f | PR AUC=%.4f | F1=%.4f | Precision=%.4f | Recall=%.4f | "
            "Accuracy=%.4f | MCC=%.4f | LogLoss=%.4f | Brier=%.4f",
            test_metrics["roc_auc"], test_metrics["pr_auc"], test_metrics["f1"], test_metrics["precision"],
            test_metrics["recall"], test_metrics["accuracy"], test_metrics["mcc"], test_metrics["log_loss"],
            test_metrics["brier_score"],
        )

    # ------------------------------------------------------------------
    # 8. SHAP explainability (built on the UNCALIBRATED winning base model)
    # ------------------------------------------------------------------
    with timer(logger, "Building SHAP explainer and computing global feature importance"):
        shap_background = X_train_t.sample(min(SHAP_BACKGROUND_SAMPLE_SIZE, len(X_train_t)), random_state=RANDOM_SEED)
        shap_explainer = ShapExplainer(best_estimator, background_data=shap_background, feature_names=FEATURE_COLUMNS)

        shap_sample = X_test_t.sample(min(SHAP_GLOBAL_IMPORTANCE_SAMPLE_SIZE, len(X_test_t)), random_state=RANDOM_SEED)
        global_importance_df = shap_explainer.global_importance(shap_sample)
        global_importance_df.to_csv(ARTIFACTS_DIR / "shap_global_importance.csv", index=False)
        global_importance_df.to_csv(ARTIFACTS_DIR / "feature_importance.csv", index=False)
        logger.info("Top 5 globally important features:\n%s", global_importance_df.head(5).to_string(index=False))

    # ------------------------------------------------------------------
    # 9. Assemble metadata + serialize the single deployable artifact
    # ------------------------------------------------------------------
    metadata = {
        "model": best_model_name,
        "strategy": best_strategy,
        "calibration_method": best_calibration_method,
        "training_rows": int(len(X_train)),
        "validation_rows": int(len(X_val)),
        "test_rows": int(len(X_test)),
        "features": len(FEATURE_COLUMNS),
        "validation_auc": test_metrics["roc_auc"],
        "validation_pr_auc": test_metrics["pr_auc"],
        "validation_f1": test_metrics["f1"],
        "validation_precision": test_metrics["precision"],
        "validation_recall": test_metrics["recall"],
        "validation_logloss": test_metrics["log_loss"],
        "validation_brier_score": test_metrics["brier_score"],
        "validation_mcc": test_metrics["mcc"],
        "optimal_threshold": optimal_threshold,
        "training_date": datetime.now(timezone.utc).isoformat(),
        "version": MODEL_VERSION,
        "target_prevalence_train": float(round(y_train.mean(), 4)),
        "notes": (
            "'validation_*' metrics above are computed on the held-out TEST split "
            "(never used for model selection, calibration, or threshold search) "
            "and represent the best unbiased estimate of production performance."
        ),
    }
    save_json(metadata, ARTIFACTS_DIR / "metrics.json")

    predictor = CreditRiskPredictor(
        preprocessor=preprocessor,
        model=calibrated_model,
        shap_explainer=shap_explainer,
        optimal_threshold=optimal_threshold,
        global_feature_importance=global_importance_df,
        metadata=metadata,
        feature_columns=list(FEATURE_COLUMNS),
    )

    joblib.dump(predictor, MODEL_ARTIFACT_PATH)
    logger.info("Serialized deployable artifact -> %s", MODEL_ARTIFACT_PATH)

    return MODEL_ARTIFACT_PATH
