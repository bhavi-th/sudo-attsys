import express from 'express';
import Assignment from '../models/Assignment.js';
import User from '../models/User.js';

const router = express.Router();

// Create a new assignment
router.post('/create', async (req, res) => {
    try {
        const { teacherId, title, description, subject, section, semester, dueDate } = req.body;

        // Validate required fields
        if (!teacherId || !title || !description || !subject || !section || !semester || !dueDate) {
            return res.status(400).json({ error: 'All required fields must be provided' });
        }

        // Get teacher information
        const teacher = await User.findById(teacherId);
        if (!teacher || teacher.role !== 'teacher') {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        // Create new assignment
        const assignment = new Assignment({
            title,
            description,
            subject,
            section,
            semester,
            dueDate: new Date(dueDate),
            teacherId,
            teacherName: teacher.name || 'Unknown Teacher'
        });

        await assignment.save();

        res.status(201).json({
            message: 'Assignment created successfully',
            assignment
        });
    } catch (err) {
        console.error('Error creating assignment:', err);
        res.status(500).json({ error: 'Server error creating assignment' });
    }
});

// Get all assignments for a teacher
router.get('/teacher/:teacherId', async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { subject, section, semester, status } = req.query;

        // Build query
        const query = { teacherId };
        
        if (subject) query.subject = subject;
        if (section) query.section = section;
        if (semester) query.semester = semester;
        if (status) query.status = status;

        const assignments = await Assignment.find(query)
            .sort({ createdAt: -1 })
            .select('-submissions'); // Exclude submissions for list view

        res.status(200).json(assignments);
    } catch (err) {
        console.error('Error fetching assignments:', err);
        res.status(500).json({ error: 'Server error fetching assignments' });
    }
});

// Get a specific assignment with submissions
router.get('/:assignmentId', async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const assignment = await Assignment.findById(assignmentId)
            .populate('submissions.studentId', 'name email usn');

        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        res.status(200).json(assignment);
    } catch (err) {
        console.error('Error fetching assignment:', err);
        res.status(500).json({ error: 'Server error fetching assignment' });
    }
});

// Update an assignment
router.put('/:assignmentId', async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { title, description, subject, section, semester, dueDate, status } = req.body;

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        // Update fields
        if (title) assignment.title = title;
        if (description) assignment.description = description;
        if (subject) assignment.subject = subject;
        if (section) assignment.section = section;
        if (semester) assignment.semester = semester;
        if (dueDate) assignment.dueDate = new Date(dueDate);
        if (status) assignment.status = status;

        await assignment.save();

        res.status(200).json({
            message: 'Assignment updated successfully',
            assignment
        });
    } catch (err) {
        console.error('Error updating assignment:', err);
        res.status(500).json({ error: 'Server error updating assignment' });
    }
});

// Delete an assignment
router.delete('/:assignmentId', async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const assignment = await Assignment.findByIdAndDelete(assignmentId);
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        res.status(200).json({
            message: 'Assignment deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting assignment:', err);
        res.status(500).json({ error: 'Server error deleting assignment' });
    }
});

// Submit an assignment (for students)
router.post('/:assignmentId/submit', async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { studentId, studentName, studentEmail, fileUrl, fileName } = req.body;

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        // Check if already submitted
        const existingSubmission = assignment.submissions.find(
            sub => sub.studentId.toString() === studentId
        );

        if (existingSubmission) {
            return res.status(400).json({ error: 'Assignment already submitted' });
        }

        // Add submission
        const submission = {
            studentId,
            studentName,
            studentEmail,
            fileUrl,
            fileName,
            submittedAt: new Date(),
            status: new Date() > assignment.dueDate ? 'late' : 'submitted'
        };

        assignment.submissions.push(submission);
        await assignment.save();

        res.status(201).json({
            message: 'Assignment submitted successfully',
            submission
        });
    } catch (err) {
        console.error('Error submitting assignment:', err);
        res.status(500).json({ error: 'Server error submitting assignment' });
    }
});

// Grade a submission
router.put('/:assignmentId/grade/:submissionId', async (req, res) => {
    try {
        const { assignmentId, submissionId } = req.params;
        const { score, feedback } = req.body;

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        const submission = assignment.submissions.id(submissionId);
        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        submission.score = score;
        submission.feedback = feedback;
        submission.status = 'graded';

        await assignment.save();

        res.status(200).json({
            message: 'Submission graded successfully',
            submission
        });
    } catch (err) {
        console.error('Error grading submission:', err);
        res.status(500).json({ error: 'Server error grading submission' });
    }
});

// Get assignments for a student
router.get('/student/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { subject, section, semester } = req.query;

        // Get student info to filter by their section and semester
        const student = await User.findById(studentId);
        if (!student || student.role !== 'student') {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Build query
        const query = {
            'section': student.section.toString(),
            'semester': student.semester.toString()
        };

        if (subject) query.subject = subject;

        const assignments = await Assignment.find(query)
            .sort({ dueDate: 1 })
            .populate('teacherId', 'name email');

        res.status(200).json(assignments);
    } catch (err) {
        console.error('Error fetching student assignments:', err);
        res.status(500).json({ error: 'Server error fetching student assignments' });
    }
});

export default router;
