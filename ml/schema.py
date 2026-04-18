from pydantic import BaseModel
from typing import List

class StudentData(BaseModel):
    attendance_percentage: float
    avg_marks: float
    assignment_completion: float
    engagement_score: float

class RiskPrediction(BaseModel):
    risk_level: str
    risk_score: float
    reasons: List[str]
