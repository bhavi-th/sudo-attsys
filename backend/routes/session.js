import express from 'express';
import { Session } from '../models/Session.js';

const router = express.Router();

// Find session by QR code details
router.post('/find', async (req, res) => {
    try {
        const { passkey, branch, subject, section, semester } = req.body;

        const activeSession = await Session.findOne({
            passkey,
            branch,
            subject,
            section: Number(section),
            semester: Number(semester),
        });

        if (!activeSession) {
            return res.status(400).json({ 
                success: false,
                error: 'Session not found or expired' 
            });
        }

        if (new Date() > activeSession.expiresAt) {
            return res.status(410).json({ 
                success: false,
                error: 'Session has expired!' 
            });
        }

        res.status(200).json({
            success: true,
            data: activeSession
        });
    } catch (error) {
        console.error('Session find error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error finding session' 
        });
    }
});

export default router;
