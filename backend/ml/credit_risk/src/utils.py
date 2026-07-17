"""Shared utility helpers: logging, timing, seeding, and JSON IO."""
from __future__ import annotations

import json
import logging
import os
import random
import sys
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Dict, Iterator, Optional

import numpy as np


def get_logger(name: str, log_file: Optional[Path] = None, level: int = logging.INFO) -> logging.Logger:
    """Create (or fetch) a configured logger that writes to stdout and, optionally, a file.

    Safe to call multiple times with the same `name` - handlers are only
    attached once, so repeated calls (e.g. from multiple modules) never
    produce duplicate log lines.
    """
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger

    logger.setLevel(level)
    fmt = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
    )

    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(fmt)
    logger.addHandler(stream_handler)

    if log_file is not None:
        log_file.parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(fmt)
        logger.addHandler(file_handler)

    logger.propagate = False
    return logger


def set_global_seed(seed: int) -> None:
    """Seed every RNG we touch so training runs are reproducible end-to-end."""
    random.seed(seed)
    np.random.seed(seed)
    os.environ["PYTHONHASHSEED"] = str(seed)


@contextmanager
def timer(logger: logging.Logger, label: str) -> Iterator[None]:
    """Context manager that logs how long a block of code took to run."""
    start = time.time()
    logger.info("Starting: %s", label)
    try:
        yield
    finally:
        elapsed = time.time() - start
        logger.info("Finished: %s (%.2fs)", label, elapsed)


def save_json(obj: Dict[str, Any], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(obj, f, indent=2, default=str)


def load_json(path: Path) -> Dict[str, Any]:
    with open(path, "r") as f:
        return json.load(f)
