#!/usr/bin/env python3
"""
Clean and validate existing student risk dataset
"""

import pandas as pd
import numpy as np
import os

def clean_and_validate_dataset(input_path: str, output_path: str):
    """Clean, validate, and relabel existing dataset"""
    
    # Load existing dataset
    print(f"Loading dataset from {input_path}")
    df = pd.read_csv(input_path)
    print(f"Original dataset shape: {df.shape}")
    
    # Check required columns
    required_columns = ['attendance_percentage', 'avg_marks', 'assignment_completion', 'engagement_score']
    missing_columns = [col for col in required_columns if col not in df.columns]
    
    if missing_columns:
        print(f"Missing columns: {missing_columns}")
        return None, f"Missing required columns: {missing_columns}"
    
    # Calculate engineered features
    df['performance_gap'] = df['attendance_percentage'] - df['avg_marks']
    df['consistency_score'] = abs(df['attendance_percentage'] - df['avg_marks'])
    
    # Apply consistent relabeling rules
    original_risk_level = df['risk_level'].copy() if 'risk_level' in df.columns else None
    original_risk_score = df['risk_score'].copy() if 'risk_score' in df.columns else None
    
    # Initialize new risk levels
    df['risk_level'] = 'LOW'
    df['risk_score'] = 0.15  # Default LOW score
    
    # Apply relabeling rules
    high_risk_mask = (
        (df['attendance_percentage'] > 85) & (df['avg_marks'] < 50) |
        (df['avg_marks'] < 40) |
        (df['attendance_percentage'] < 60) |
        (df['performance_gap'] > 30)
    )
    
    medium_risk_mask = (
        (df['performance_gap'] > 15) & ~high_risk_mask
    )
    
    # Set risk levels
    df.loc[high_risk_mask, 'risk_level'] = 'HIGH'
    df.loc[medium_risk_mask, 'risk_level'] = 'MEDIUM'
    
    # Generate risk scores based on new labels
    np.random.seed(42)  # For reproducibility
    df.loc[df['risk_level'] == 'HIGH', 'risk_score'] = np.random.uniform(0.6, 1.0, high_risk_mask.sum())
    df.loc[df['risk_level'] == 'MEDIUM', 'risk_score'] = np.random.uniform(0.3, 0.6, medium_risk_mask.sum())
    df.loc[df['risk_level'] == 'LOW', 'risk_score'] = np.random.uniform(0.0, 0.3, (df['risk_level'] == 'LOW').sum())
    
    # Clean inconsistent rows
    inconsistent_high = (df['performance_gap'] <= 30) & (df['risk_level'] == 'HIGH')
    inconsistent_low = (df['performance_gap'] >= 10) & (df['risk_level'] == 'LOW')
    
    rows_to_remove = inconsistent_high | inconsistent_low
    rows_removed = rows_to_remove.sum()
    
    if rows_to_remove.any():
        print(f"Removing {rows_removed} inconsistent rows")
        df = df[~rows_to_remove]
    
    # Final column selection and ordering
    final_columns = [
        'attendance_percentage', 'avg_marks', 'assignment_completion', 'engagement_score',
        'performance_gap', 'consistency_score', 'risk_level', 'risk_score'
    ]
    
    df_clean = df[final_columns]
    
    # Save cleaned dataset
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df_clean.to_csv(output_path, index=False)
    
    # Generate summary
    summary = {
        'original_rows': len(df) + rows_removed,
        'rows_removed': rows_removed,
        'final_rows': len(df_clean),
        'risk_distribution': df_clean['risk_level'].value_counts().to_dict(),
        'avg_performance_gap': df_clean['performance_gap'].mean(),
        'avg_consistency_score': df_clean['consistency_score'].mean()
    }
    
    print(f"\n=== DATASET CLEANING SUMMARY ===")
    print(f"Original rows: {summary['original_rows']}")
    print(f"Rows removed: {summary['rows_removed']}")
    print(f"Final rows: {summary['final_rows']}")
    print(f"Risk distribution: {summary['risk_distribution']}")
    print(f"Saved to: {output_path}")
    
    return df_clean, summary

def main():
    input_path = os.path.join(os.path.dirname(__file__), 'dataset', 'student_data.csv')
    output_path = os.path.join(os.path.dirname(__file__), 'dataset', 'cleaned_student_risk_dataset.csv')
    
    result, summary = clean_and_validate_dataset(input_path, output_path)
    
    if result is None:
        print(f"Error: {summary}")
        return 1
    
    print("Dataset cleaning completed successfully!")
    return 0

if __name__ == "__main__":
    exit(main())
