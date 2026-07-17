
import json

import joblib

forecaster = joblib.load("models/forecasting_pipeline.joblib")

explanation = forecaster.explain_next_day(
    shop_id="S01",
    category="cooking_essentials",
    location_type="urban",
    is_staple=1,
    is_perishable=0,
    last_date="2026-07-14",
    sales_history=[12, 15, 10, 18, 14, 16, 20, 17, 19, 21, 18, 22, 24, 25,
                   19, 20, 18, 23, 21, 22, 24],
    transactions_history=[6, 8, 5, 9, 7, 8, 10, 8, 9, 10, 9, 11, 12, 12,
                           9, 10, 9, 11, 10, 11, 12],
)

print(json.dumps(explanation, indent=2, default=str))
