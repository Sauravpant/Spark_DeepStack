"""
VyaparAI - Synthetic Credit Risk Data Generator (v2)
======================================================
Generates realistic synthetic data for the customer-level udhaaro (credit)
risk model for kirana stores.

Design:
- Simulation runs over SIM_YEARS (3-5 years) per customer population, giving
  realistic relationship lengths and enough repayment history to matter.
- Every credit (udhaaro) purchase IS eventually repaid - this is informal
  shop credit, not a bank loan, so there is no permanent default/write-off.
- Each customer gets FOUR independent hidden traits (not one composite
  risk_score): shopping_frequency, credit_preference, spending_capacity,
  repayment_discipline. These drive simulated behavior only - they are
  NEVER written to the final dataset.
- Rows are only recorded once a customer has completed enough credit
  cycles (3-5, randomized per customer) that repayment-history features
  are meaningful, not mostly zeros.
- The target (is_risk) is generated from a logistic function of the
  customer's ACTUAL computed history features (outstanding balance,
  past late repayments, credit utilization, repayment consistency) plus
  the hidden repayment_discipline trait and a small noise term - not a
  flat random probability. This is what makes the features genuinely
  predictive of the label.

Run (from the project root): python3 scripts/generate_credit_data.py
Output: data/raw/credit_risk_dataset.csv  (18 features + is_risk, nothing else)
"""

import heapq
from collections import deque
from pathlib import Path

import numpy as np
import pandas as pd

# Project-relative output path: <project_root>/data/raw/credit_risk_dataset.csv
# (this script lives in <project_root>/scripts/, so parent.parent is the root)
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "data" / "raw" / "credit_risk_dataset.csv"

# ----------------------------------------------------------------------
# CONFIG
# ----------------------------------------------------------------------
SEED = 42
SIM_YEARS = 4
SIM_DAYS = 365 * SIM_YEARS          # 3-5 year window (default 4y)
N_CUSTOMERS = 9000
ON_TIME_DAYS = 14                   # informal udhaaro "expected" repayment window
RISK_THRESHOLD_DAYS = 30            # target definition: repaid AFTER this many days = risky
MAX_REPAY_DAYS = 120                # practical cap - credit is ALWAYS eventually repaid
AMOUNT_MIN, AMOUNT_MAX = 20, 4000   # realistic kirana transaction range
TARGET_ROWS = 55000
MIN_CYCLES_CHOICES = [3, 4, 5]       # start recording only after this many completed cycles

np.random.seed(SEED)

SHOP_FREQ_CATEGORIES = [
    ("daily",      0.25, (0.55, 0.90)),
    ("weekly",     0.45, (0.12, 0.35)),
    ("occasional", 0.30, (0.02, 0.10)),
]
_freq_names = [c[0] for c in SHOP_FREQ_CATEGORIES]
_freq_weights = [c[1] for c in SHOP_FREQ_CATEGORIES]
_freq_ranges = {c[0]: c[2] for c in SHOP_FREQ_CATEGORIES}


def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))


def simulate_customer(cid: int, rows: list):
    # ---------------- four INDEPENDENT hidden traits (internal only) ----------------
    freq_cat = np.random.choice(_freq_names, p=_freq_weights)
    lo, hi = _freq_ranges[freq_cat]
    txn_rate = np.random.uniform(lo, hi)                                   # shopping frequency

    credit_preference = np.random.beta(2, 3)                               # 0-1, how credit-reliant
    credit_prob = np.clip(0.05 + credit_preference * 0.60 + np.random.normal(0, 0.03), 0.02, 0.70)

    spending_capacity = np.exp(np.random.uniform(np.log(60), np.log(900)))  # typical order value

    repayment_discipline = np.random.beta(2.2, 2.2)                        # 0-1, higher = repays faster/safer

    min_cycles_required = np.random.choice(MIN_CYCLES_CHOICES)

    # join day biased toward earlier in the window so most customers accumulate real history,
    # while still allowing some newer/shorter-tenure customers for diversity
    join_day = int(np.random.beta(1, 2.5) * (SIM_DAYS - 90))
    active_days = SIM_DAYS - join_day
    if active_days < 60:
        return

    day_offsets = np.where(np.random.random(active_days) < txn_rate)[0]
    if len(day_offsets) == 0:
        return
    txn_days = join_day + day_offsets
    n_txn = len(txn_days)
    is_credit = np.random.random(n_txn) < credit_prob

    sigma = 0.55
    mu = np.log(spending_capacity)
    amounts = np.clip(np.random.lognormal(mu, sigma, n_txn), AMOUNT_MIN, AMOUNT_MAX)

    # ---------------- running state (all O(1)/O(log n) amortized updates) ----------------
    window = deque()          # (day, amount, is_credit) for rolling 30d window
    cash_30_sum = 0.0
    credit_30_sum = 0.0
    credit_30_count = 0
    txn_30_count = 0

    total_all_count = 0
    total_all_amount = 0.0
    total_credit_count_ever = 0
    total_credit_amount_ever = 0.0

    pending = []               # heap of (resolved_day, amount, days_to_repay)
    completed_count = 0
    completed_sum_days = 0.0
    completed_sumsq_days = 0.0
    on_time_count = 0
    severely_late_count = 0
    repaid_amount_running = 0.0

    total_credit_issued_so_far = 0.0
    current_outstanding = 0.0
    max_outstanding = 0.0
    last_txn_day = None
    rows_recorded_for_customer = 0
    MAX_ROWS_PER_CUSTOMER = 15

    def flush_resolutions(up_to_day):
        nonlocal completed_count, completed_sum_days, completed_sumsq_days
        nonlocal on_time_count, severely_late_count, repaid_amount_running, current_outstanding
        while pending and pending[0][0] <= up_to_day:
            resolved_day, amt_r, dtr = heapq.heappop(pending)
            completed_count += 1
            completed_sum_days += dtr
            completed_sumsq_days += dtr * dtr
            if dtr <= ON_TIME_DAYS:
                on_time_count += 1
            if dtr > RISK_THRESHOLD_DAYS:
                severely_late_count += 1
            repaid_amount_running += amt_r
            current_outstanding -= amt_r

    for i in range(n_txn):
        day = int(txn_days[i])
        amt = float(amounts[i])

        # apply any repayments that completed by "today" before computing/recording anything
        flush_resolutions(day)

        # maintain rolling 30-day window
        window.append((day, amt, bool(is_credit[i])))
        if is_credit[i]:
            credit_30_sum += amt
            credit_30_count += 1
        else:
            cash_30_sum += amt
        txn_30_count += 1
        window_start = day - 30
        while window and window[0][0] < window_start:
            d0, a0, c0 = window.popleft()
            if c0:
                credit_30_sum -= a0
                credit_30_count -= 1
            else:
                cash_30_sum -= a0
            txn_30_count -= 1

        if is_credit[i]:
            # ---------- features computed from state strictly BEFORE this transaction ----------
            if completed_count >= min_cycles_required:
                relationship_days = day - join_day

                avg_purchase_amount = (total_all_amount / total_all_count) if total_all_count > 0 else 0.0
                avg_credit_txn_amount = (
                    total_credit_amount_ever / total_credit_count_ever if total_credit_count_ever > 0 else 0.0
                )
                credit_to_purchase_ratio = (
                    total_credit_amount_ever / total_all_amount if total_all_amount > 0 else 0.0
                )
                outstanding_to_avg_txn_ratio = (
                    current_outstanding / avg_credit_txn_amount if avg_credit_txn_amount > 0 else 0.0
                )
                pct_on_time = on_time_count / completed_count
                avg_days_to_repay = completed_sum_days / completed_count
                variance = max(completed_sumsq_days / completed_count - avg_days_to_repay ** 2, 0.0)
                repay_consistency = float(np.sqrt(variance)) if completed_count >= 2 else 0.0
                hist_repaid_ratio = (
                    repaid_amount_running / total_credit_issued_so_far if total_credit_issued_so_far > 0 else 0.0
                )
                days_since_last_purchase = (day - last_txn_day) if last_txn_day is not None else 0
                severe_late_rate = severely_late_count / completed_count

                # ---------- label: logistic function of ACTUAL history features + hidden discipline ----------
                outstanding_intensity = current_outstanding / (avg_credit_txn_amount + 1e-6)
                late_repay_rate = 1 - pct_on_time
                consistency_norm = min(repay_consistency / 20.0, 3.0)
                discipline_term = 1 - repayment_discipline

                logit = (
                    -5.6
                    + 0.9 * np.log1p(outstanding_intensity)
                    + 2.2 * late_repay_rate
                    + 1.8 * credit_to_purchase_ratio
                    + 0.5 * consistency_norm
                    + 2.0 * severe_late_rate
                    + 1.6 * discipline_term
                    + np.random.normal(0, 0.35)
                )
                p_risk = sigmoid(logit)
                label = 1 if np.random.random() < p_risk else 0

                rows.append({
                    "relationship_days": int(relationship_days),
                    "cash_purchase_value_last_30d": round(cash_30_sum, 2),
                    "credit_purchase_value_last_30d": round(credit_30_sum, 2),
                    "transaction_count_last_30d": int(txn_30_count),
                    "credit_transaction_count_last_30d": int(credit_30_count),
                    "avg_purchase_amount": round(avg_purchase_amount, 2),
                    "avg_credit_transaction_amount": round(avg_credit_txn_amount, 2),
                    "credit_to_purchase_ratio": round(credit_to_purchase_ratio, 4),
                    "current_outstanding_balance": round(current_outstanding, 2),
                    "outstanding_to_avg_transaction_ratio": round(outstanding_to_avg_txn_ratio, 4),
                    "pct_repaid_on_time": round(pct_on_time, 4),
                    "avg_days_to_repay": round(avg_days_to_repay, 2),
                    "repayment_consistency": round(repay_consistency, 2),
                    "historical_repayment_ratio": round(hist_repaid_ratio, 4),
                    "num_completed_credit_cycles": int(completed_count),
                    "num_severely_late_repayments": int(severely_late_count),
                    "max_outstanding_ever": round(max_outstanding, 2),
                    "days_since_last_purchase": int(days_since_last_purchase),
                    "is_risk": label,
                })
                rows_recorded_for_customer += 1
            else:
                # not enough history yet - still need SOME label to generate this txn's
                # repayment outcome for the ledger; use discipline-only baseline (no row recorded)
                label = 1 if np.random.random() < np.clip(0.15 + (1 - repayment_discipline) * 0.25, 0.03, 0.6) else 0

            # ---------- generate this transaction's actual repayment delay, conditioned on label ----------
            if label == 0:
                mean_days = 3 + (1 - repayment_discipline) * 10
                dtr = float(np.clip(np.random.gamma(2.0, mean_days / 2.0), 0, RISK_THRESHOLD_DAYS))
            else:
                late_scale = 8 + (1 - repayment_discipline) * 20
                dtr = float(np.clip(RISK_THRESHOLD_DAYS + 1 + np.random.gamma(2.0, late_scale), 0, MAX_REPAY_DAYS))

            resolved_day = day + dtr
            heapq.heappush(pending, (resolved_day, amt, dtr))

            total_credit_issued_so_far += amt
            current_outstanding += amt
            max_outstanding = max(max_outstanding, current_outstanding)
            total_credit_count_ever += 1
            total_credit_amount_ever += amt

        total_all_count += 1
        total_all_amount += amt
        last_txn_day = day

        if rows_recorded_for_customer >= MAX_ROWS_PER_CUSTOMER:
            break


def main():
    rows = []
    cid = 0
    while len(rows) < TARGET_ROWS * 1.15 and cid < N_CUSTOMERS * 4:
        simulate_customer(cid, rows)
        cid += 1

    df = pd.DataFrame(rows)
    print(f"Simulated {cid} customers -> {len(df)} raw rows (after {MIN_CYCLES_CHOICES} min-cycle gating)")

    if len(df) > TARGET_ROWS:
        pos = df[df.is_risk == 1]
        neg = df[df.is_risk == 0]
        frac = TARGET_ROWS / len(df)
        pos_s = pos.sample(frac=frac, random_state=SEED)
        neg_s = neg.sample(frac=frac, random_state=SEED)
        df = pd.concat([pos_s, neg_s]).sample(frac=1, random_state=SEED).reset_index(drop=True)

    print(f"Final dataset: {len(df)} rows")
    print(f"Risk rate (repaid late, >{RISK_THRESHOLD_DAYS}d): {df.is_risk.mean():.3%}")

    FINAL_COLUMNS = [
        "relationship_days",
        "cash_purchase_value_last_30d",
        "credit_purchase_value_last_30d",
        "transaction_count_last_30d",
        "credit_transaction_count_last_30d",
        "avg_purchase_amount",
        "avg_credit_transaction_amount",
        "credit_to_purchase_ratio",
        "current_outstanding_balance",
        "outstanding_to_avg_transaction_ratio",
        "pct_repaid_on_time",
        "avg_days_to_repay",
        "repayment_consistency",
        "historical_repayment_ratio",
        "num_completed_credit_cycles",
        "num_severely_late_repayments",
        "max_outstanding_ever",
        "days_since_last_purchase",
        "is_risk",
    ]
    df = df[FINAL_COLUMNS]
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"Saved {OUTPUT_PATH}")


if __name__ == "__main__":
    main()