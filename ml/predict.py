import requests
from model import StudentRiskModel
from schema import StudentData, RiskPrediction

def fetch_assignment(student_id: str) -> float:
    """Fetch assignment completion from backend API"""
    try:
        # Call backend API
        response = requests.get(f"http://localhost:5000/api/assignment/{student_id}", timeout=5)
        if response.status_code == 200:
            data = response.json()
            return data.get('assignment_completion', 70)
        else:
            return 70  # Fail-safe default
    except Exception:
        return 70  # Fail-safe default if API fails

def predict_student_risk(data: StudentData) -> RiskPrediction:
    """Predict student risk based on input data"""
    model = StudentRiskModel()
    
    # Handle both old format (with assignment_completion) and new format (with student_id)
    if hasattr(data, 'assignment_completion') and data.assignment_completion != 70:
        # Old format: use provided assignment_completion
        assignment_completion = data.assignment_completion
    else:
        # New format: fetch assignment completion from backend API
        assignment_completion = fetch_assignment(data.student_id)
    
    # Convert Pydantic model to dict
    input_data = {
        'attendance_percentage': data.attendance_percentage,
        'avg_marks': data.avg_marks,
        'assignment_completion': assignment_completion,
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
