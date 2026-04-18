import express from 'express';
import qrcode from 'qrcode';
import crypto from 'crypto';
import { Session } from '../models/Session.js';

const router = express.Router();

const SESSION_DURATION_MS = 10 * 1000;

const buildPayload = ({ branch, subject, section, passkey, semester }) =>
    `${branch}|${subject}|${section}|${passkey}|${semester}|${Date.now()}`;

router.post('/session/start', async (req, res) => {
    try {
        const { teacherId, branch, section, subject, semester } = req.body;

        if (!teacherId || !section || !subject || !branch || !semester) {
            return res
                .status(400)
                .json({ error: 'Missing teacherId, branch, section, semester or subject' });
        }

        const session = await Session.create({
            passkey: crypto.randomBytes(16).toString('hex'),
            teacherId,
            subject,
            section: Number(section),
            semester: Number(semester),
            branch,
            expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
            isActive: true,
        });

        return res.status(201).json({
            sessionId: session._id,
            expiresAt: session.expiresAt,
        });
    } catch (err) {
        console.error('Session start error:', err);
        return res.status(500).json({ error: 'Failed to start session' });
    }
});

router.post('/session/stop', async (req, res) => {
    try {
        const { sessionId } = req.body;

        const session = await Session.findByIdAndUpdate(
            sessionId,
            { isActive: false, expiresAt: new Date() },
            { new: true },
        );

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        return res.status(200).json({ message: 'Session stopped' });
    } catch (err) {
        console.error('Session stop error:', err);
        return res.status(500).json({ error: 'Failed to stop session' });
    }
});

router.get('/qr', async (req, res) => {
    try {
        const { teacherId, branch, section, subject, semester, sessionId } = req.query;
        let activeSession = null;

        if (sessionId) {
            activeSession = await Session.findById(sessionId);

            if (!activeSession || !activeSession.isActive || new Date() > activeSession.expiresAt) {
                return res.status(404).send('Session expired or inactive');
            }
        } else {
            if (!teacherId || !section || !subject || !branch || !semester) {
                return res.status(400).send('Missing teacherId, branch, section, semester or subject');
            }

            activeSession = await Session.create({
                passkey: crypto.randomBytes(16).toString('hex'),
                teacherId,
                subject,
                section: Number(section),
                semester: Number(semester),
                branch,
                expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
                isActive: true,
            });
        }

        const complexPayload = buildPayload(activeSession);

        res.setHeader('Content-Type', 'image/png');

        await qrcode.toFileStream(res, complexPayload, {
            errorCorrectionLevel: 'H',
            margin: 1,
            color: {
                dark: '#000000',
                light: '#ffffff',
            },
        });

        console.log(
            `Successfully generated QR for session ${activeSession._id} (${activeSession.subject})`,
        );
    } catch (err) {
        console.error('Internal Server Error Detail:', err);
        res.status(500).send(err.message);
    }
});

export default router;
