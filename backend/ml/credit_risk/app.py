from fastapi import FastAPI
import joblib

app = FastAPI()

model = joblib.load("./models/credit_risk_pipeline.joblib")


@app.get("/")
def read_root():
    return {"message": "Welcome to the Credit Risk API"}


@app.get("/predict")
def predict():
    result = model.predict(
        relationship_days=45,
        cash_purchase_value_last_30d=1800.50,
        credit_purchase_value_last_30d=6200.75,
        transaction_count_last_30d=18,
        credit_transaction_count_last_30d=15,
        avg_purchase_amount=444.51,
        avg_credit_transaction_amount=413.38,
        credit_to_purchase_ratio=0.775,
        current_outstanding_balance=8450.20,
        outstanding_to_avg_transaction_ratio=20.44,
        pct_repaid_on_time=0.18,
        avg_days_to_repay=54.30,
        repayment_consistency=42.15,
        historical_repayment_ratio=0.29,
        num_completed_credit_cycles=2,
        num_severely_late_repayments=8,
        max_outstanding_ever=12680.40,
        days_since_last_purchase=27,
    )
    return result