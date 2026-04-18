import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder
import joblib
import os
from .utils import load_dataset, get_feature_importance

class StudentRiskModel:
    def __init__(self, model_type='logistic_regression'):
        self.model_type = model_type
        self.model = None
        self.label_encoder = LabelEncoder()
        self.feature_names = ['attendance_percentage', 'avg_marks', 'assignment_completion', 'engagement_score', 'performance_gap', 'consistency_score']
        
    def train(self):
        """Train risk prediction model on controlled dataset"""
        # Load controlled dataset
        df = load_dataset()
        
        # Use original features (dataset already has controlled patterns)
        feature_names = [
            'attendance_percentage', 'avg_marks', 'assignment_completion', 
            'engagement_score', 'performance_gap', 'consistency_score'
        ]
        
        # Prepare features and target
        X = df[feature_names]
        y = df['risk_level']
        
        # Encode target variable
        y_encoded = self.label_encoder.fit_transform(y)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded)
        
        # Choose and train model
        if self.model_type == 'logistic_regression':
            self.model = LogisticRegression(
                random_state=42,
                max_iter=1000
            )
        elif self.model_type == 'random_forest':
            self.model = RandomForestClassifier(
                random_state=42,
                n_estimators=100,
                max_depth=10
            )
        else:
            self.model = DecisionTreeClassifier(
                random_state=42,
                max_depth=10
            )
        
        self.model.fit(X_train, y_train)
        
        # Evaluate model
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        print(f"Model trained successfully. Accuracy: {accuracy:.3f}")
        
        # Save model
        self.save_model()
        
        return accuracy
    
    def predict(self, data: dict) -> dict:
        """Predict risk with continuous scoring"""
        if self.model is None:
            self.load_model()
        
        # Calculate engineered features
        performance_gap = data['attendance_percentage'] - data['avg_marks']
        consistency_score = abs(data['attendance_percentage'] - data['avg_marks'])
        
        # CONTINUOUS SCORING: Compute risk_score FIRST
        risk_score = (
            0.4 * (100 - data['avg_marks']) +
            0.4 * (100 - data['attendance_percentage']) +
            0.15 * (100 - data['engagement_score']) +
            0.05 * (100 - data['assignment_completion'])
        ) / 100
        
        # Apply reduced non-linear scaling (less compression)
        risk_score = risk_score ** 1.15
        
        # Add penalty boosts for critical cases
        if data['avg_marks'] < 50:
            risk_score += 0.05
        if data['attendance_percentage'] < 50:
            risk_score += 0.05
        
        # REFINED MID-RANGE ADJUSTMENTS: Only apply if clearly weak
        # Apply penalties only if both conditions indicate weakness
        if data['avg_marks'] < 65 and data['attendance_percentage'] < 70:
            risk_score += 0.08
        elif data['avg_marks'] < 65:
            risk_score += 0.03
        elif data['attendance_percentage'] < 70:
            risk_score += 0.03
        
        # Clamp between 0 and 1
        risk_score = min(max(risk_score, 0), 1)
        
        # REMOVED: Randomness for deterministic output
        
        # DERIVE risk_level FROM risk_score with strict LOW range
        if risk_score >= 0.70:
            risk_level = 'HIGH'
        elif risk_score >= 0.30:
            risk_level = 'MEDIUM'
        else:
            risk_level = 'LOW'
        
        # CRITICAL OVERRIDE RULES (academic dominance)
        reasons = []
        
        # SEVERITY-BASED BOOST: Add severity for HIGH cases
        if data['avg_marks'] < 40:
            risk_score += (40 - data['avg_marks']) / 100
        if data['attendance_percentage'] < 40:
            risk_score += (40 - data['attendance_percentage']) / 100
        
        # Clamp after severity boost
        risk_score = min(max(risk_score, 0), 1)
        
        # CRITICAL OVERRIDE: Weak academic performance ALWAYS HIGH risk
        if data['avg_marks'] < 40 or data['attendance_percentage'] < 40:
            risk_score = max(risk_score, 0.75)
            risk_level = 'HIGH'
            reasons.append('Critical academic risk (low marks/attendance)')
        
        # STRONGER COMBINED CONDITION: Both weak metrics
        elif data['avg_marks'] < 40 and data['attendance_percentage'] < 50:
            risk_score = max(risk_score, 0.8)
            risk_level = 'HIGH'
            reasons.append('Severe academic risk (low marks and attendance)')
        
        # Rule 1: Very low attendance and marks -> HIGH risk
        elif data['attendance_percentage'] < 40 and data['avg_marks'] < 40:
            risk_score = max(risk_score, 0.8)
            risk_level = 'HIGH'
            reasons.append('Very low attendance and marks')
        
        # Rule 2: Very low marks -> HIGH risk
        elif data['avg_marks'] < 35:
            risk_score = max(risk_score, 0.75)
            risk_level = 'HIGH'
            reasons.append('Very low academic performance')
        
        # Rule 3: Performance anomaly -> HIGH risk
        elif data['attendance_percentage'] > 85 and data['avg_marks'] < 50:
            risk_score = max(risk_score, 0.7)
            risk_level = 'HIGH'
            reasons.append('Performance anomaly detected')
        
        # Generate reasons prioritizing marks > attendance > engagement > assignment
        if not reasons:
            # Priority-based reason generation
            if data['avg_marks'] < 40:
                reasons.append('Very low marks')
            elif data['avg_marks'] < 60:
                reasons.append('Low academic performance')
            
            if data['attendance_percentage'] < 40:
                reasons.append('Very low attendance')
            elif data['attendance_percentage'] < 60:
                reasons.append('Low attendance')
            
            if data['engagement_score'] < 40:
                reasons.append('Low engagement')
            elif data['engagement_score'] < 60:
                reasons.append('Moderate engagement')
            
            if data['assignment_completion'] < 40:
                reasons.append('Low assignment completion')
            
            # Add performance gap reason if significant
            if abs(performance_gap) > 30:
                reasons.append('Performance mismatch')
        
        # Ensure we have at least one reason
        if not reasons:
            reasons = ['Normal academic performance']
        
        return {
            'risk_level': risk_level,
            'risk_score': float(risk_score),
            'reasons': reasons[:3]  # Return top 3 reasons
        }
    
    def save_model(self):
        """Save trained model to disk"""
        model_path = os.path.join(os.path.dirname(__file__), 'model.pkl')
        encoder_path = os.path.join(os.path.dirname(__file__), 'label_encoder.pkl')
        
        joblib.dump(self.model, model_path)
        joblib.dump(self.label_encoder, encoder_path)
        print(f"Model saved to {model_path}")
    
    def load_model(self):
        """Load trained model from disk"""
        model_path = os.path.join(os.path.dirname(__file__), 'model.pkl')
        encoder_path = os.path.join(os.path.dirname(__file__), 'label_encoder.pkl')
        
        if not os.path.exists(model_path):
            raise FileNotFoundError("Model not found. Please train the model first.")
        
        self.model = joblib.load(model_path)
        self.label_encoder = joblib.load(encoder_path)
        print(f"Model loaded from {model_path}")

def train_and_save_model():
    """Train and save the model (call this once to setup)"""
    model = StudentRiskModel(model_type='logistic_regression')
    accuracy = model.train()
    print(f"Model training completed with accuracy: {accuracy:.3f}")
    return model
