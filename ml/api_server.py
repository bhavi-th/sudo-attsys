#!/usr/bin/env python3
"""
Python API server for ML predictions
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
import sys

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from ml.predict import predict_student_risk
from ml.schema import StudentData, RiskPrediction

app = FastAPI(title="Student Risk Prediction API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

@app.post("/predict")
async def predict_risk(data: StudentData) -> RiskPrediction:
    """Predict student risk based on input data"""
    try:
        prediction = predict_student_risk(data)
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "Student Risk Prediction API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    print("Starting ML API server on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
