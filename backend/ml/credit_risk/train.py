#!/usr/bin/env python3
"""
Entry point for training the VyaparAI Credit Risk model end-to-end.

Usage
-----
    python train.py
    python train.py --data-path data/raw/my_custom_dataset.csv

This script contains no modeling logic itself - it only wires together
`src.trainer.run_training_pipeline`, so that CI/CD, cron jobs, or a Makefile
can invoke training with a single, stable command.

Prerequisite
------------
Generate (or supply) the training data first:

    python scripts/generate_credit_data.py

which writes `data/raw/credit_risk_dataset.csv`.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Ensure the project root is importable as a package root regardless of the
# working directory this script is invoked from.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from src.config import LOGS_DIR, RANDOM_SEED, RAW_DATA_PATH  # noqa: E402
from src.trainer import run_training_pipeline  # noqa: E402
from src.utils import get_logger, set_global_seed  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train the VyaparAI credit risk model.")
    parser.add_argument(
        "--data-path",
        type=str,
        default=str(RAW_DATA_PATH),
        help="Path to the training CSV (18 raw features + is_risk).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    logger = get_logger("train", log_file=LOGS_DIR / "train.log")
    set_global_seed(RANDOM_SEED)

    logger.info("=" * 78)
    logger.info("VyaparAI Credit Risk Model - Training Pipeline")
    logger.info("=" * 78)

    artifact_path = run_training_pipeline(data_path=Path(args.data_path), logger=logger)

    logger.info("=" * 78)
    logger.info("Training complete. Deployable artifact written to: %s", artifact_path)
    logger.info("Artifacts (metrics, comparisons, SHAP tables) written to: artifacts/")
    logger.info("=" * 78)


if __name__ == "__main__":
    main()
