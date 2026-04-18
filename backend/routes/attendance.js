import express from 'express';
import Attendance from '../models/Attendance.js';
import { Session } from '../models/Session.js';
import User from '../models/User.js';

const router = express.Router();

// 1. Verify and Mark Attendance
router.post('/verify', async (req, res) => {
    // Added semester to destructuring
    const { passkey, studentId, branch, subject, section, semester } = req.body;

    try {
        const activeSession = await Session.findOne({
            passkey,
            branch,
            subject,
            section,
            semester, // Context check for semester
        });

        if (!activeSession) {
            return res.status(400).json({ error: 'Invalid QR code or context mismatch' });
        }

        if (new Date() > activeSession.expiresAt) {
            return res.status(410).json({ error: 'QR Code has expired!' });
        }

        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({ error: 'Student profile not found' });
        }

        // Validation including semester check
        const isCorrectBranch = student.branch === branch;
        const isCorrectSection = student.section === Number(section);
        // Assuming student model also stores their current semester
        // const isCorrectSemester = student.semester === Number(semester);

        if (!isCorrectBranch || !isCorrectSection) {
            return res.status(403).json({
                error: `Access denied: Target ${branch}-${section}, but you are ${student.branch}-${student.section}`,
            });
        }

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const alreadyMarked = await Attendance.findOne({
            studentId,
            subject,
            semester, // Ensure they haven't marked for this semester/subject today
            date: { $gte: todayStart, $lte: todayEnd },
        });

        if (alreadyMarked) {
            return res
                .status(400)
                .json({ error: 'Attendance already recorded for this subject today' });
        }

        await Attendance.create({
            studentId,
            usn: student.usn,
            studentName: student.name,
            teacherId: activeSession.teacherId,
            subject,
            section,
            branch,
            semester, // Saving semester to the Attendance record
            sessionId: activeSession._id, // Link attendance to the specific session
            status: 'Present',
            date: new Date(),
        });

        res.status(200).json({ message: 'Attendance marked successfully!' });
    } catch (err) {
        console.error('VERIFY ERROR:', err);
        res.status(500).json({ error: 'Server error during verification' });
    }
});

// 2. Fetch Attendance List (Added :semester to the URL params)
router.get('/list/:teacherId/:branch/:subject/:section/:semester', async (req, res) => {
    try {
        const { teacherId, branch, subject, semester, section } = req.params;
        const { sessionId } = req.query; // Optional sessionId parameter

        const sectionNum = parseInt(section, 10);
        const semesterNum = parseInt(semester, 10);

        // Validation: If either is NaN, return a clean error instead of crashing
        if (isNaN(sectionNum) || isNaN(semesterNum)) {
            return res.status(400).json({
                error: `Invalid parameters. Received Section: ${section}, Semester: ${semester}`,
            });
        }

        // Find all students matching this specific branch, semester, and section
        const allStudents = await User.find({
            section: Number(section),
            branch,
            semester: Number(semester), // Uncomment if your User model tracks semester
        });

        // Build the attendance query
        const attendanceQuery = {
            teacherId,
            branch,
            subject,
            semester: Number(semester),
            section: Number(section),
        };

        // If sessionId is provided, filter by that session only (for real-time display during active session)
        if (sessionId) {
            attendanceQuery.sessionId = sessionId;
        } else {
            // Otherwise, keep showing the most recent session table for this class.
            const latestSessionRecord = await Attendance.findOne(attendanceQuery)
                .sort({ date: -1 })
                .select('sessionId');

            if (!latestSessionRecord) {
                return res.status(200).json([]);
            }

            attendanceQuery.sessionId = latestSessionRecord.sessionId;
        }

        const attendanceRecords = await Attendance.find(attendanceQuery);

        // Create a map of student USN to their attendance status
        const attendanceMap = {};
        attendanceRecords.forEach((record) => {
            attendanceMap[record.usn] = record.status;
        });

        let combinedData = allStudents.map((student) => {
            const status = attendanceMap[student.usn] || 'Absent';
            return {
                Name: student.name || 'N/A',
                USN: student.usn || 'N/A',
                Status: status,
            };
        });

        combinedData.sort((a, b) =>
            a.USN.localeCompare(b.USN, undefined, {
                numeric: true,
                sensitivity: 'base',
            }),
        );

        const finalFormattedData = combinedData.map((item, index) => ({
            Sno: (index + 1).toString().padStart(2, '0'),
            ...item,
        }));

        res.status(200).json(finalFormattedData);
    } catch (err) {
        console.error('Fetch List Error:', err);
        res.status(500).json({ error: 'Failed to fetch list' });
    }
});

// 3. Fetch complete attendance history for a teacher
router.get('/history/:teacherId', async (req, res) => {
    try {
        const { teacherId } = req.params;

        const history = await Attendance.find({ teacherId })
            .sort({ date: -1 })
            .select('studentName usn subject branch section semester status date');

        res.status(200).json(history);
    } catch (err) {
        console.error('Fetch History Error:', err);
        res.status(500).json({ error: 'Failed to fetch attendance history' });
    }
});

export default router;
