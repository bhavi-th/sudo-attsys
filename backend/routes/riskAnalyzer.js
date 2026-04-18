import express from 'express';
import Student from '../models/Student.js';

const router = express.Router();

// Clear all students for a specific session
router.delete('/clear-session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        // Clear students with this session ID AND students without session IDs (old data)
        const [sessionResult, oldResult] = await Promise.all([
            Student.deleteMany({ teacherSession: sessionId }),
            Student.deleteMany({ teacherSession: { $exists: false } })
        ]);
        
        const totalDeleted = sessionResult.deletedCount + oldResult.deletedCount;
        
        res.json({
            success: true,
            deletedCount: totalDeleted,
            sessionDeleted: sessionResult.deletedCount,
            oldDeleted: oldResult.deletedCount,
            message: `Cleared ${totalDeleted} students (${sessionResult.deletedCount} from session, ${oldResult.deletedCount} old records)`
        });
    } catch (error) {
        console.error('Error clearing session students:', error);
        res.status(500).json({ error: 'Failed to clear session students' });
    }
});

// Emergency clear all students (for debugging)
router.delete('/clear-all', async (req, res) => {
    try {
        const result = await Student.deleteMany({});
        
        res.json({
            success: true,
            deletedCount: result.deletedCount,
            message: `Emergency clear: removed all ${result.deletedCount} students`
        });
    } catch (error) {
        console.error('Error clearing all students:', error);
        res.status(500).json({ error: 'Failed to clear all students' });
    }
});

// Get students for risk analysis (filtered by session if provided)
router.get('/students', async (req, res) => {
    try {
        const { sessionId } = req.query;
        
        let query = {};
        if (sessionId) {
            query.teacherSession = sessionId;
        }
        
        const students = await Student.find(query).sort({ generatedAt: -1 }).limit(100);
        res.json({
            success: true,
            data: students,
            count: students.length,
            sessionId: sessionId || 'all'
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch student data'
        });
    }
});

// Get risk analysis summary
router.get('/summary', async (req, res) => {
    try {
        const students = await Student.find();
        
        // Calculate risk distribution
        const riskDistribution = {
            Low: 0,
            Medium: 0,
            High: 0
        };
        
        let totalAttendance = 0;
        let totalMarks = 0;
        let totalEngagement = 0;
        let totalAssignments = 0;
        
        students.forEach(student => {
            // Count risk levels with proper validation
            let riskLevel = student.aiInsights?.riskLevel || 'Medium';
            
            // Normalize risk level to handle different casing and ensure valid keys
            riskLevel = riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1).toLowerCase();
            
            // Only increment if the risk level exists in our distribution object
            if (riskDistribution.hasOwnProperty(riskLevel)) {
                riskDistribution[riskLevel]++;
            } else {
                // Default to Medium if unknown risk level
                riskDistribution.Medium++;
            }
            
            // Sum metrics with validation
            totalAttendance += student.attendance || 0;
            totalMarks += student.marks || 0;
            totalEngagement += student.engagement || 0;
            totalAssignments += student.assignments || 0;
        });
        
        const count = students.length;
        const averages = {
            attendance: count > 0 ? Math.round((totalAttendance / count) * 100) / 100 : 0,
            marks: count > 0 ? Math.round((totalMarks / count) * 100) / 100 : 0,
            engagement: count > 0 ? Math.round((totalEngagement / count) * 100) / 100 : 0,
            assignments: count > 0 ? Math.round((totalAssignments / count) * 100) / 100 : 0
        };
        
        // Identify at-risk students (High risk or multiple low metrics)
        const atRiskStudents = students.filter(student => {
            const riskLevel = student.aiInsights?.riskLevel;
            const normalizedRiskLevel = riskLevel ? riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1).toLowerCase() : 'Medium';
            
            if (normalizedRiskLevel === 'High') return true;
            
            // Check for multiple low metrics with validation
            const attendance = student.attendance || 0;
            const marks = student.marks || 0;
            const engagement = student.engagement || 0;
            const assignments = student.assignments || 0;
            
            const lowMetrics = [
                attendance < 60,
                marks < 60,
                engagement < 60,
                assignments < 60
            ].filter(Boolean).length;
            
            return lowMetrics >= 3;
        });
        
        res.json({
            success: true,
            data: {
                totalStudents: count,
                riskDistribution,
                averages,
                atRiskStudents: atRiskStudents.map(s => ({
                    student_id: s.student_id,
                    name: s.name,
                    riskLevel: s.aiInsights?.riskLevel || 'Medium',
                    attendance: s.attendance,
                    marks: s.marks,
                    engagement: s.engagement,
                    assignments: s.assignments,
                    insights: s.aiInsights?.insights || []
                })),
                atRiskCount: atRiskStudents.length
            }
        });
    } catch (error) {
        console.error('Error generating risk summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate risk summary'
        });
    }
});

// Add or update student data
router.post('/student', async (req, res) => {
    try {
        const { student_id, name, attendance, marks, engagement, assignments, archetype, characteristics, aiInsights } = req.body;
        
        const studentData = {
            student_id,
            name,
            attendance,
            marks,
            engagement,
            assignments,
            archetype,
            characteristics,
            aiInsights,
            lastUpdated: new Date()
        };
        
        const student = await Student.findOneAndUpdate(
            { student_id },
            studentData,
            { upsert: true, new: true }
        );
        
        res.json({
            success: true,
            data: student,
            message: 'Student data saved successfully'
        });
    } catch (error) {
        console.error('Error saving student data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save student data'
        });
    }
});

export default router;
