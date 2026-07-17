#!/usr/bin/env python3
"""
CLI: get the binary risk decision + calibrated probability for one customer.

Usage
-----
    python inference/predict.py inference/sample_customer.json
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.predictor import predict  # noqa: E402


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: python inference/predict.py <customer.json>")
        sys.exit(1)

    with open(sys.argv[1], "r") as f:
        raw_features = json.load(f)

    result = predict(**raw_features)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
