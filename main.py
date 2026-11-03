from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

app = FastAPI(
    title="Customer Churn Prediction API",
    description="Production-grade churn inference service using Scikit-Learn pipeline.",
    version="1.0.0"
)

# Enable CORS for local development flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static frontend directory
STATIC_DIR = Path("static")
STATIC_DIR.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Load model artifact at application startup
MODEL_PATH = Path("models/churn_prediction_pipeline.joblib")
if not MODEL_PATH.exists():
    raise RuntimeError(f"Model artifact not found at {MODEL_PATH}. Ensure the file exists.")

pipeline = joblib.load(MODEL_PATH)
OPTIMIZED_THRESHOLD = 0.55


# Request validation schema matching raw customer payload
class CustomerData(BaseModel):
    gender: str = Field(..., example="Female")
    SeniorCitizen: int = Field(..., ge=0, le=1, example=0)
    Partner: str = Field(..., example="No")
    Dependents: str = Field(..., example="No")
    tenure: int = Field(..., ge=0, le=72, example=2)
    PhoneService: str = Field(..., example="Yes")
    MultipleLines: str = Field(..., example="No")
    InternetService: str = Field(..., example="Fiber optic")
    OnlineSecurity: str = Field(..., example="No")
    OnlineBackup: str = Field(..., example="No")
    DeviceProtection: str = Field(..., example="No")
    TechSupport: str = Field(..., example="No")
    StreamingTV: str = Field(..., example="Yes")
    StreamingMovies: str = Field(..., example="No")
    Contract: str = Field(..., example="Month-to-month")
    PaperlessBilling: str = Field(..., example="Yes")
    PaymentMethod: str = Field(..., example="Electronic check")
    MonthlyCharges: float = Field(..., ge=10.0, le=200.0, example=85.50)
    TotalCharges: float = Field(..., ge=0.0, example=171.00)


def run_feature_engineering(df: pd.DataFrame) -> pd.DataFrame:
    """Replicates domain feature engineering pipeline."""
    df = df.copy()
    
    # 1. Tenure Grouping
    tenure_bins = [-1, 12, 24, 48, 60, 72]
    tenure_labels = ["0-12m", "13-24m", "25-48m", "49-60m", "61-72m"]
    df["TenureGroup"] = pd.cut(df["tenure"], bins=tenure_bins, labels=tenure_labels).astype("object")

    # 2. Total Addon Services
    addon_services = [
        "OnlineSecurity", "OnlineBackup", "DeviceProtection",
        "TechSupport", "StreamingTV", "StreamingMovies"
    ]
    df["TotalServices"] = (df[addon_services] == "Yes").sum(axis=1)

    # 3. Monthly Spend Difference vs Historical Average
    historical_monthly_avg = df["TotalCharges"] / (df["tenure"] + 1)
    df["AvgMonthlySpendDiff"] = (df["MonthlyCharges"] - historical_monthly_avg).round(2)
    
    return df


@app.get("/")
def serve_index():
    index_file = STATIC_DIR / "index.html"
    if not index_file.exists():
        raise HTTPException(status_code=404, detail="Frontend file not found.")
    return FileResponse(index_file)


@app.post("/predict")
def predict_churn(customer: CustomerData):
    try:
        # Convert Pydantic payload to DataFrame
        raw_dict = customer.model_dump()
        input_df = pd.DataFrame([raw_dict])
        
        # Apply Feature Transformations
        processed_df = run_feature_engineering(input_df)
        
        # Inference via loaded pipeline
        prob = float(pipeline.predict_proba(processed_df)[0, 1])
        will_churn = bool(prob >= OPTIMIZED_THRESHOLD)
        
        # Determine actionable risk tier
        if prob >= 0.60:
            risk_tier = "High Risk"
            recommendation = "Critical flight risk. Immediately dispatch proactive retention voucher or discounted 1-year contract lock."
        elif prob >= 0.35:
            risk_tier = "Medium Risk"
            recommendation = "Moderate risk. Trigger satisfaction survey, recommend value-add services (Security/Backup), and monitor ticket volume."
        else:
            risk_tier = "Low Risk"
            recommendation = "Healthy account. Standard engagement cadence; no intervention needed."

        return {
            "churn_probability": round(prob, 4),
            "will_churn": will_churn,
            "decision_threshold": OPTIMIZED_THRESHOLD,
            "risk_tier": risk_tier,
            "recommendation": recommendation
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))