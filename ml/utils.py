import pandas as pd
import numpy as np
import os
from typing import Tuple

def load_dataset() -> pd.DataFrame:
    """Load dataset from ml/dataset/ folder or create synthetic data"""
    dataset_path = os.path.join(os.path.dirname(__file__), 'dataset', 'student_data.csv')
    
    if os.path.exists(dataset_path):
        print(f"Loading existing dataset from {dataset_path}")
        return pd.read_csv(dataset_path)
    else:
        print("No dataset found, generating synthetic data...")
        df = generate_synthetic_data()
        save_dataset(df, dataset_path)
        return df

def save_dataset(df: pd.DataFrame, path: str) -> None:
    """Save dataset to CSV file"""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    df.to_csv(path, index=False)
    print(f"Dataset saved to {path}")

def generate_synthetic_data(n_samples: int = 10000) -> pd.DataFrame:
    """Generate synthetic student data with bias-fixing logic"""
    np.random.seed(42)
    
    # Generate base features with realistic distributions
    attendance_percentage = np.random.normal(75, 15, n_samples).clip(0, 100)
    avg_marks = np.random.normal(70, 20, n_samples).clip(0, 100)
    assignment_completion = np.random.normal(80, 18, n_samples).clip(0, 100)
    engagement_score = np.random.normal(65, 22, n_samples).clip(0, 100)
    
    # Add engineered features
    performance_gap = attendance_percentage - avg_marks
    consistency_score = np.abs(attendance_percentage - avg_marks)
    
    # Calculate risk score with weighted priorities (marks and attendance dominate)
    base_risk_score = (
        (100 - attendance_percentage) * 0.35 +  # Increased weight for attendance
        (100 - avg_marks) * 0.35 +               # Increased weight for marks
        (100 - assignment_completion) * 0.15 +   # Reduced weight for assignments
        (100 - engagement_score) * 0.10 +        # Reduced weight for engagement
        performance_gap * 0.03 +                 # Small weight for performance gap
        consistency_score * 0.02                 # Small weight for consistency
    ) / 100
    
    # Apply critical override rules to training data
    # Rule 1: Very low attendance and marks (critical risk)
    critical_mask = (attendance_percentage < 40) & (avg_marks < 40)
    base_risk_score[critical_mask] = np.maximum(base_risk_score[critical_mask], 0.75)
    
    # Rule 2: Performance anomaly (high attendance but low marks)
    anomaly_mask = (attendance_percentage > 85) & (avg_marks < 50)
    base_risk_score[anomaly_mask] = np.maximum(base_risk_score[anomaly_mask], 0.80)
    
    # Rule 3: Very low academic performance
    low_marks_mask = avg_marks < 35
    base_risk_score[low_marks_mask] = np.maximum(base_risk_score[low_marks_mask], 0.70)
    
    # Rule 4: Low attendance threshold
    low_attendance_mask = attendance_percentage < 40
    base_risk_score[low_attendance_mask] = np.maximum(base_risk_score[low_attendance_mask], 0.65)
    
    # Limit positive feature influence
    high_assignment_mask = assignment_completion > 80
    high_engagement_mask = engagement_score > 80
    positive_mask = high_assignment_mask | high_engagement_mask
    # For students with high positive features but low critical metrics, ensure proper risk level
    critical_positive_mask = positive_mask & ((attendance_percentage < 50) | (avg_marks < 50))
    base_risk_score[critical_positive_mask] = np.maximum(base_risk_score[critical_positive_mask], 0.6)
    
    # Determine risk level with adjusted thresholds
    risk_level = np.where(base_risk_score < 0.25, 'LOW',
                 np.where(base_risk_score < 0.55, 'MEDIUM', 'HIGH'))
    
    df = pd.DataFrame({
        'attendance_percentage': attendance_percentage,
        'avg_marks': avg_marks,
        'assignment_completion': assignment_completion,
        'engagement_score': engagement_score,
        'performance_gap': performance_gap,
        'consistency_score': consistency_score,
        'risk_level': risk_level,
        'risk_score': base_risk_score
    })
    
    return df

def get_feature_importance(model, feature_names: list) -> dict:
    """Get feature importance from trained model"""
    if hasattr(model, 'feature_importances_'):
        # Decision Tree
        importance = model.feature_importances_
    elif hasattr(model, 'coef_'):
        # Logistic Regression
        importance = np.abs(model.coef_[0])
    else:
        return {}
    
    return dict(zip(feature_names, importance))

def generate_reasons(data: dict, feature_importance: dict) -> list:
    """Generate human-readable reasons for risk prediction"""
    reasons = []
    
    # Define thresholds for low performance
    thresholds = {
        'attendance_percentage': 70,
        'avg_marks': 60,
        'assignment_completion': 75,
        'engagement_score': 65
    }
    
    # Check each feature against threshold
    for feature, threshold in thresholds.items():
        value = data.get(feature, 0)
        if value < threshold:
            if feature == 'attendance_percentage':
                reasons.append(f"Low attendance ({value:.1f}%)")
            elif feature == 'avg_marks':
                reasons.append(f"Poor academic performance ({value:.1f}%)")
            elif feature == 'assignment_completion':
                reasons.append(f"Low assignment completion ({value:.1f}%)")
            elif feature == 'engagement_score':
                reasons.append(f"Low engagement ({value:.1f}%)")
    
    # If no specific reasons, provide general assessment
    if not reasons:
        reasons.append("Good overall performance")
    
    return reasons[:3]  # Return top 3 reasons
