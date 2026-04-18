#!/usr/bin/env python3
"""
Standalone script to generate synthetic dataset for student risk prediction
Run this script to create the initial dataset
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from ml.utils import generate_synthetic_data, save_dataset

def main():
    print("Generating synthetic student dataset...")
    
    # Generate 10,000 samples
    df = generate_synthetic_data(n_samples=10000)
    
    # Save to dataset folder
    dataset_path = os.path.join(os.path.dirname(__file__), 'dataset', 'student_data.csv')
    save_dataset(df, dataset_path)
    
    print(f"Dataset generated with {len(df)} samples")
    print("\nDataset statistics:")
    print(df.describe())
    print("\nRisk level distribution:")
    print(df['risk_level'].value_counts(normalize=True))

if __name__ == "__main__":
    main()
