import express from 'express';
import Student from '../models/Student.js';

const router = express.Router();

// Student profile archetypes for realistic data generation
const studentArchetypes = [
    {
        type: 'high_achiever',
        baseProfile: {
            attendance: 85,
            marks: 88,
            engagement: 90,
            assignments: 92
        },
        characteristics: 'Consistent high performer, excellent time management'
    },
    {
        type: 'average_student',
        baseProfile: {
            attendance: 75,
            marks: 72,
            engagement: 70,
            assignments: 78
        },
        characteristics: 'Balanced performance, room for improvement'
    },
    {
        type: 'struggling_student',
        baseProfile: {
            attendance: 60,
            marks: 55,
            engagement: 50,
            assignments: 65
        },
        characteristics: 'Needs support in multiple areas'
    },
    {
        type: 'engaged_but_struggling',
        baseProfile: {
            attendance: 80,
            marks: 58,
            engagement: 85,
            assignments: 70
        },
        characteristics: 'High participation but academic challenges'
    },
    {
        type: 'disengaged_high_potential',
        baseProfile: {
            attendance: 65,
            marks: 75,
            engagement: 45,
            assignments: 80
        },
        characteristics: 'Good capability but low participation'
    }
];

// ML-inspired data correlation logic
const generateRealisticProfile = (archetype, variance = 0.1) => {
    const profile = { ...archetype.baseProfile };
    
    // Add realistic correlations between metrics
    // Attendance strongly correlates with engagement
    const attendanceVariance = (Math.random() - 0.5) * 20 * variance;
    profile.attendance = Math.max(40, Math.min(100, profile.attendance + attendanceVariance));
    profile.attendance = Math.round(profile.attendance * 100) / 100;
    
    // Engagement correlates with attendance
    profile.engagement = Math.max(30, Math.min(100, 
        profile.engagement + (profile.attendance - archetype.baseProfile.attendance) * 0.3));
    profile.engagement = Math.round(profile.engagement * 100) / 100;
    
    // Marks correlate with assignments but with some variance
    const marksVariance = (Math.random() - 0.5) * 15 * variance;
    profile.marks = Math.max(40, Math.min(100, profile.marks + marksVariance));
    profile.marks = Math.round(profile.marks * 100) / 100;
    
    // Assignments correlate with marks and engagement
    profile.assignments = Math.max(40, Math.min(100, 
        profile.assignments + (profile.marks - archetype.baseProfile.marks) * 0.2 + 
        (profile.engagement - archetype.baseProfile.engagement) * 0.1));
    profile.assignments = Math.round(profile.assignments * 100) / 100;
    
    return profile;
};

// Generate simple insights based on archetype (no ML needed)
const generateSimpleInsights = (profile, archetype) => {
    // Determine risk level based on archetype
    let riskLevel, insights, focusAreas, potential;
    
    switch (archetype.type) {
        case 'high_achiever':
            riskLevel = 'Low';
            insights = [
                'Consistent high performance across all metrics',
                'Excellent time management and study habits',
                'Strong engagement in classroom activities'
            ];
            focusAreas = ['Maintain Performance', 'Advanced Challenges'];
            potential = 'Excellent candidate for advanced academic opportunities';
            break;
            
        case 'average_student':
            riskLevel = 'Medium';
            insights = [
                'Balanced performance with room for improvement',
                'Good foundation in core subjects',
                'Consistent effort visible across metrics'
            ];
            focusAreas = ['Study Techniques', 'Time Management'];
            potential = 'Good potential with focused effort and support';
            break;
            
        case 'struggling_student':
            riskLevel = 'High';
            insights = [
                'Needs support in multiple academic areas',
                'Low attendance affecting overall performance',
                'Requires intervention to improve engagement'
            ];
            focusAreas = ['Attendance Improvement', 'Academic Support', 'Engagement Building'];
            potential = 'Needs significant intervention and personalized support';
            break;
            
        case 'engaged_but_struggling':
            riskLevel = 'Medium';
            insights = [
                'High participation but academic challenges',
                'Strong engagement despite performance issues',
                'Needs academic support while maintaining motivation'
            ];
            focusAreas = ['Academic Support', 'Study Skills'];
            potential = 'Good potential with targeted academic assistance';
            break;
            
        case 'disengaged_high_potential':
            riskLevel = 'Medium';
            insights = [
                'Good capability but low participation',
                'High potential not fully utilized',
                'Needs motivation and engagement strategies'
            ];
            focusAreas = ['Engagement Building', 'Motivation'];
            potential = 'Excellent potential if engagement can be improved';
            break;
            
        default:
            riskLevel = 'Medium';
            insights = ['Standard academic performance'];
            focusAreas = ['Overall Performance'];
            potential = 'Room for growth with proper guidance';
    }
    
    return {
        riskLevel,
        insights,
        focusAreas,
        potential,
        riskScore: riskLevel === 'Low' ? 0.2 : riskLevel === 'Medium' ? 0.5 : 0.8,
        archetype: archetype.type
    };
};

// Generate student data with AI enhancement
router.post('/generate', async (req, res) => {
    try {
        const { studentType, teacherSession, stream, section } = req.body;
        
        // Select archetype (random if not specified)
        const archetype = studentType ? 
            studentArchetypes.find(a => a.type === studentType) :
            studentArchetypes[Math.floor(Math.random() * studentArchetypes.length)];
        
        if (!archetype) {
            return res.status(400).json({ error: 'Invalid student type' });
        }
        
        // Generate realistic profile
        const profile = generateRealisticProfile(archetype);
        
        // Generate simple insights based on archetype
        const aiInsights = generateSimpleInsights(profile, archetype);
        
        // Generate random student details
        const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sage', 'River'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez'];
        
        const studentData = {
            student_id: 'STU' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
            stream: stream || 'CSE',
            section: section || 'A',
            ...profile,
            archetype: archetype.type,
            characteristics: archetype.characteristics,
            aiInsights,
            teacherSession: teacherSession || 'default-session',
            generatedAt: new Date().toISOString()
        };

        // Save to database
        try {
            const student = new Student(studentData);
            await student.save();
            console.log('Student data saved to database:', student.student_id);
        } catch (dbError) {
            console.error('Failed to save student to database:', dbError);
        }
        
        res.json({
            success: true,
            data: studentData,
            message: 'Student profile generated successfully'
        });
        
    } catch (error) {
        console.error('Student data generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate student data',
            details: error.message 
        });
    }
});

// Get available student archetypes
router.get('/archetypes', (req, res) => {
    res.json({
        success: true,
        data: studentArchetypes.map(archetype => ({
            type: archetype.type,
            characteristics: archetype.characteristics,
            baseProfile: archetype.baseProfile
        }))
    });
});

// Quick generate without AI (fallback)
router.post('/generate/simple', (req, res) => {
    try {
        const { studentType } = req.body;
        
        const archetype = studentType ? 
            studentArchetypes.find(a => a.type === studentType) :
            studentArchetypes[Math.floor(Math.random() * studentArchetypes.length)];
        
        if (!archetype) {
            return res.status(400).json({ error: 'Invalid student type' });
        }
        
        const profile = generateRealisticProfile(archetype);
        
        const studentData = {
            student_id: 'STU' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            name: `Student ${Math.floor(Math.random() * 1000)}`,
            ...profile,
            archetype: archetype.type,
            characteristics: archetype.characteristics,
            generatedAt: new Date().toISOString()
        };
        
        res.json({
            success: true,
            data: studentData,
            message: 'Simple student profile generated successfully'
        });
        
    } catch (error) {
        console.error('Simple student data generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate student data',
            details: error.message 
        });
    }
});

export default router;
