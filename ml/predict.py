from .model import StudentRiskModel
from .schema import StudentData, RiskPrediction

def predict_student_risk(data: StudentData) -> RiskPrediction:
    """Predict student risk based on input data"""
    model = StudentRiskModel()
    
    # Convert Pydantic model to dict
    input_data = {
        'attendance_percentage': data.attendance_percentage,
        'avg_marks': data.avg_marks,
        'assignment_completion': data.assignment_completion,
        'engagement_score': data.engagement_score
    }
    
    # Make prediction
    prediction = model.predict(input_data)
    
    # Return in specified format
    return RiskPrediction(
        risk_level=prediction['risk_level'],
        risk_score=prediction['risk_score'],
        reasons=prediction['reasons']
    )
