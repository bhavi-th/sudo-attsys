import express from 'express';

const router = express.Router();

// POST /api/risk/predict - Predict student risk
router.post('/predict', async (req, res) => {
    try {
        const { attendance_percentage, avg_marks, assignment_completion, engagement_score } = req.body;
        
        // Validate input
        if (!attendance_percentage || !avg_marks || !assignment_completion || !engagement_score) {
            return res.status(400).json({ 
                error: 'Missing required fields: attendance_percentage, avg_marks, assignment_completion, engagement_score' 
            });
        }
        
        // Validate ranges
        const values = [attendance_percentage, avg_marks, assignment_completion, engagement_score];
        if (values.some(val => val < 0 || val > 100)) {
            return res.status(400).json({ 
                error: 'All values must be between 0 and 100' 
            });
        }
        
        // Call Python ML API
        const mlApiUrl = 'http://localhost:8000/predict';
        const predictionData = {
            attendance_percentage: parseFloat(attendance_percentage),
            avg_marks: parseFloat(avg_marks),
            assignment_completion: parseFloat(assignment_completion),
            engagement_score: parseFloat(engagement_score)
        };
        
        const response = await fetch(mlApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(predictionData),
        });
        
        if (!response.ok) {
            throw new Error(`ML API responded with status: ${response.status}`);
        }
        
        const prediction = await response.json();
        res.status(200).json(prediction);
    } catch (error) {
        console.error('Risk prediction error:', error);
        
        // Check if ML API is not running
        if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch')) {
            return res.status(503).json({ 
                error: 'ML service is not running. Please start the Python ML API server on port 8000.' 
            });
        }
        
        res.status(500).json({ error: 'Server error during risk prediction' });
    }
});

export default router;
