import express from 'express';

const router = express.Router();

// GET /api/assignment/:student_id
router.get('/:student_id', (req, res) => {
    const { student_id } = req.params;
    
    // Generate deterministic assignment completion based on student_id
    // Use hash-like function to ensure same student_id always returns same value
    let hash = 0;
    for (let i = 0; i < student_id.length; i++) {
        const char = student_id.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert hash to value between 50 and 100
    const assignment_completion = Math.abs(hash % 51) + 50;
    
    res.json({
        student_id: student_id,
        assignment_completion: assignment_completion
    });
});

export default router;
