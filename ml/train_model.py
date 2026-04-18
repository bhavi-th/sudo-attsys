#!/usr/bin/env python3
"""
Standalone script to train the student risk prediction model
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from ml.model import train_and_save_model
import pandas as pd
import os

def main():
    print("Training student risk prediction model with controlled dataset...")
    
    # Use controlled dataset
    dataset_path = os.path.join(os.path.dirname(__file__), 'dataset', 'student_risk_dataset.csv')
    
    if os.path.exists(dataset_path):
        print(f"Using controlled dataset: {dataset_path}")
        # Update utils.load_dataset to use controlled dataset
        from ml import utils
        utils.load_dataset = lambda: pd.read_csv(dataset_path)
        
        # Train model
        model = train_and_save_model()
        
        # Print dataset stats
        df = pd.read_csv(dataset_path)
        print(f"Dataset size: {len(df)} samples")
        print(f"Risk distribution: {df['risk_level'].value_counts().to_dict()}")
    else:
        print("Controlled dataset not found. Please run generate_controlled_dataset.py first.")
        return None
    
    print("Model training completed!")
    return model

if __name__ == "__main__":
    main()
