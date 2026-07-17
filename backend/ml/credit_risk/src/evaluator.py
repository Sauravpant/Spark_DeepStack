
from __future__ import annotations

import logging
from typing import Dict, Tuple

import numpy as np
from sklearn.calibration import calibration_curve
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    balanced_accuracy_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    log_loss,
    matthews_corrcoef,
    precision_score,
    recall_score,
    roc_auc_score,
)

from .config import THRESHOLD_GRID_MAX, THRESHOLD_GRID_MIN, THRESHOLD_GRID_STEP

logger = logging.getLogger(__name__)


def find_optimal_threshold(y_true: np.ndarray, y_proba: np.ndarray) -> Tuple[float, float]:
    """Scan a threshold grid [0.05, 0.95] and return the (threshold, f1) that maximizes F1.

    Degenerate thresholds (predicting a single class for the whole set) are
    skipped so the search never "wins" by collapsing to a trivial classifier.
    """
    grid = np.arange(THRESHOLD_GRID_MIN, THRESHOLD_GRID_MAX + 1e-9, THRESHOLD_GRID_STEP)
    best_threshold, best_f1 = 0.5, -1.0
    for t in grid:
        preds = (y_proba >= t).astype(int)
        if preds.sum() == 0 or preds.sum() == len(preds):
            continue
        f1 = f1_score(y_true, preds, zero_division=0)
        if f1 > best_f1:
            best_f1, best_threshold = f1, float(t)
    if best_f1 < 0:
        logger.warning("Threshold search found no non-degenerate split; defaulting to 0.5.")
        best_threshold, best_f1 = 0.5, f1_score(y_true, (y_proba >= 0.5).astype(int), zero_division=0)
    return round(best_threshold, 4), round(float(best_f1), 4)


def classification_metrics(y_true: np.ndarray, y_proba: np.ndarray, threshold: float) -> Dict[str, float]:
    """Compute the full metric suite required by the spec at a fixed threshold."""
    y_pred = (y_proba >= threshold).astype(int)

    raw = {
        "roc_auc": roc_auc_score(y_true, y_proba),
        "pr_auc": average_precision_score(y_true, y_proba),
        "f1": f1_score(y_true, y_pred, zero_division=0),
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall": recall_score(y_true, y_pred, zero_division=0),
        "accuracy": accuracy_score(y_true, y_pred),
        "balanced_accuracy": balanced_accuracy_score(y_true, y_pred),
        "mcc": matthews_corrcoef(y_true, y_pred),
        "log_loss": log_loss(y_true, y_proba, labels=[0, 1]),
        "brier_score": brier_score_loss(y_true, y_proba),
        "threshold": threshold,
    }
    return {k: round(float(v), 6) for k, v in raw.items()}


def confusion_matrix_dict(y_true: np.ndarray, y_proba: np.ndarray, threshold: float) -> Dict[str, int]:
    y_pred = (y_proba >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
    return {
        "true_negative": int(tn),
        "false_positive": int(fp),
        "false_negative": int(fn),
        "true_positive": int(tp),
    }


def calibration_curve_points(y_true: np.ndarray, y_proba: np.ndarray, n_bins: int = 10):
    """Return (mean_predicted_prob, fraction_of_positives) for a reliability diagram."""
    frac_pos, mean_pred = calibration_curve(y_true, y_proba, n_bins=n_bins, strategy="quantile")
    return mean_pred, frac_pos


def ranking_key(row: Dict[str, float]) -> tuple:
    """Model-selection ordering mandated by the spec:

        1. ROC AUC (higher is better)
        2. PR AUC (higher is better)
        3. F1 Score, after threshold optimization (higher is better)
        4. Calibration quality via Brier score (lower is better)
        5. MCC (higher is better)

    Returns a tuple suitable for `min(...)` (i.e. "smaller tuple = better model").
    """
    return (
        -row["roc_auc"],
        -row["pr_auc"],
        -row["f1"],
        row["brier_score"],
        -row["mcc"],
    )
