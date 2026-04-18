# Student Risk Prediction ML Module

## Overview
This module provides a student risk prediction system that analyzes attendance, marks, assignments, and engagement to determine academic risk levels.

## Installation

1. Navigate to the ML folder:
```bash
cd ml
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Training the Model
```bash
python train_model.py
```

### Generating Dataset
```bash
python generate_controlled_dataset.py
```

### Starting ML API Server
```bash
python api_server.py
```

The API server will run on `http://localhost:8000`

### API Endpoint
- **POST** `/predict` - Predict student risk

Request body:
```json
{
    "attendance_percentage": 75,
    "avg_marks": 80,
    "assignment_completion": 85,
    "engagement_score": 70
}
```

Response:
```json
{
    "risk_level": "LOW",
    "risk_score": 0.25,
    "reasons": ["Good academic performance", "High attendance"]
}
```

## Risk Levels
- **LOW**: < 30% risk score
- **MEDIUM**: 30-70% risk score  
- **HIGH**: > 70% risk score

## Features
- Continuous scoring (no bucketed values)
- Academic dominance (marks/attendance override engagement/assignments)
- Severity-based scoring for HIGH risk cases
- Deterministic output (no randomness)
- Anomaly detection (high attendance + low marks)

## Files
- `model.py` - Core prediction logic
- `train_model.py` - Model training script
- `generate_controlled_dataset.py` - Dataset generation
- `api_server.py` - FastAPI server
- `utils.py` - Utility functions
- `requirements.txt` - Python dependencies
