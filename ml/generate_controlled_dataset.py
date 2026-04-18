#!/usr/bin/env python3
"""
Generate controlled student risk dataset with explicit patterns
"""

import pandas as pd
import numpy as np
import os

def generate_controlled_dataset(n_samples: int = 10000) -> pd.DataFrame:
    """Generate dataset with mandatory patterns and controlled distributions"""
    np.random.seed(42)
    
    # Pattern 1: High attendance + high marks → LOW risk (30% of data)
    n_pattern1 = int(n_samples * 0.3)
    pattern1 = {
        'attendance_percentage': np.random.normal(85, 8, n_pattern1).clip(70, 100),
        'avg_marks': np.random.normal(85, 8, n_pattern1).clip(70, 100),
        'assignment_completion': np.random.normal(85, 10, n_pattern1).clip(60, 100),
        'engagement_score': np.random.normal(80, 10, n_pattern1).clip(60, 100)
    }
    
    # Pattern 2: Low attendance + low marks → HIGH risk (25% of data)
    n_pattern2 = int(n_samples * 0.25)
    pattern2 = {
        'attendance_percentage': np.random.normal(30, 10, n_pattern2).clip(10, 50),
        'avg_marks': np.random.normal(30, 10, n_pattern2).clip(10, 50),
        'assignment_completion': np.random.normal(60, 20, n_pattern2).clip(20, 100),
        'engagement_score': np.random.normal(40, 15, n_pattern2).clip(10, 70)
    }
    
    # Pattern 3: High attendance + low marks → HIGH risk (anomaly) (15% of data)
    n_pattern3 = int(n_samples * 0.15)
    pattern3 = {
        'attendance_percentage': np.random.normal(90, 5, n_pattern3).clip(85, 100),
        'avg_marks': np.random.normal(35, 10, n_pattern3).clip(15, 50),
        'assignment_completion': np.random.normal(75, 15, n_pattern3).clip(50, 100),
        'engagement_score': np.random.normal(60, 15, n_pattern3).clip(30, 90)
    }
    
    # Pattern 4: Low attendance + high marks → MEDIUM risk (15% of data)
    n_pattern4 = int(n_samples * 0.15)
    pattern4 = {
        'attendance_percentage': np.random.normal(35, 10, n_pattern4).clip(15, 55),
        'avg_marks': np.random.normal(85, 8, n_pattern4).clip(70, 100),
        'assignment_completion': np.random.normal(80, 15, n_pattern4).clip(50, 100),
        'engagement_score': np.random.normal(70, 15, n_pattern4).clip(40, 95)
    }
    
    # Pattern 5: Mixed cases (15% of data)
    n_pattern5 = n_samples - (n_pattern1 + n_pattern2 + n_pattern3 + n_pattern4)
    pattern5 = {
        'attendance_percentage': np.random.normal(60, 20, n_pattern5).clip(20, 95),
        'avg_marks': np.random.normal(60, 20, n_pattern5).clip(20, 95),
        'assignment_completion': np.random.normal(70, 20, n_pattern5).clip(30, 100),
        'engagement_score': np.random.normal(60, 20, n_pattern5).clip(20, 95)
    }
    
    # Combine all patterns
    all_data = {}
    for key in pattern1.keys():
        all_data[key] = np.concatenate([
            pattern1[key], pattern2[key], pattern3[key], 
            pattern4[key], pattern5[key]
        ])
    
    # Create DataFrame
    df = pd.DataFrame(all_data)
    
    # Calculate engineered features
    df['performance_gap'] = df['attendance_percentage'] - df['avg_marks']
    df['consistency_score'] = abs(df['performance_gap'])
    
    # Calculate controlled risk score with stronger signals
    df['risk_score'] = (
        0.4 * (100 - df['avg_marks']) +
        0.4 * (100 - df['attendance_percentage']) +
        0.15 * (100 - df['engagement_score']) +
        0.05 * (100 - df['assignment_completion'])
    ) / 100
    
    # Apply non-linear scaling to increase spread
    df['risk_score'] = df['risk_score'] ** 1.3
    
    # Add penalty boosts for critical cases
    penalty_boost = np.zeros(len(df))
    penalty_boost[df['avg_marks'] < 50] += 0.1
    penalty_boost[df['attendance_percentage'] < 50] += 0.1
    df['risk_score'] = df['risk_score'] + penalty_boost
    
    # Clamp between 0 and 1
    df['risk_score'] = df['risk_score'].clip(0, 1)
    
    # Apply critical override rules
    # Rule 1: Very low attendance and marks
    critical_mask = (df['attendance_percentage'] < 40) & (df['avg_marks'] < 40)
    df.loc[critical_mask, 'risk_score'] = df.loc[critical_mask, 'risk_score'].apply(lambda x: max(x, 0.8))
    
    # Rule 2: Very low marks
    low_marks_mask = df['avg_marks'] < 35
    df.loc[low_marks_mask, 'risk_score'] = df.loc[low_marks_mask, 'risk_score'].apply(lambda x: max(x, 0.75))
    
    # Rule 3: Performance anomaly
    anomaly_mask = (df['attendance_percentage'] > 85) & (df['avg_marks'] < 50)
    df.loc[anomaly_mask, 'risk_score'] = df.loc[anomaly_mask, 'risk_score'].apply(lambda x: max(x, 0.7))
    
    # Map risk scores to risk levels with reduced MEDIUM range
    df['risk_level'] = np.where(df['risk_score'] >= 0.75, 'HIGH',
                               np.where(df['risk_score'] >= 0.45, 'MEDIUM', 'LOW'))
    
    # Ensure critical cases are HIGH
    df.loc[critical_mask, 'risk_level'] = 'HIGH'
    df.loc[low_marks_mask, 'risk_level'] = 'HIGH'
    df.loc[anomaly_mask, 'risk_level'] = 'HIGH'
    
    # Shuffle dataset
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    return df

def main():
    """Generate and save controlled dataset"""
    print("Generating controlled student risk dataset...")
    
    # Generate dataset
    df = generate_controlled_dataset(10000)
    
    # Save dataset
    output_path = os.path.join(os.path.dirname(__file__), 'dataset', 'student_risk_dataset.csv')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    
    # Print statistics
    print(f"\n=== DATASET STATISTICS ===")
    print(f"Total samples: {len(df)}")
    print(f"Risk distribution:")
    print(df['risk_level'].value_counts())
    print(f"\nFeature ranges:")
    for col in ['attendance_percentage', 'avg_marks', 'assignment_completion', 'engagement_score']:
        print(f"{col}: {df[col].min():.1f} - {df[col].max():.1f} (mean: {df[col].mean():.1f})")
    print(f"Performance gap: {df['performance_gap'].min():.1f} - {df['performance_gap'].max():.1f}")
    print(f"Risk score: {df['risk_score'].min():.3f} - {df['risk_score'].max():.3f}")
    print(f"\nDataset saved to: {output_path}")
    
    return df

if __name__ == "__main__":
    main()
