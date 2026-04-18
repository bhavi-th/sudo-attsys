from pydantic import BaseModel
from typing import List

class StudentData(BaseModel):
    student_id: str = "default"
    attendance_percentage: float
    avg_marks: float
    engagement_score: float
    assignment_completion: float = 70

class RiskPrediction(BaseModel):
    risk_level: str
    risk_score: float
    reasons: List[str]
