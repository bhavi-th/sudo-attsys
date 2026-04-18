import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/verify', async (req, res) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ valid: false });

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        res.status(200).json({ valid: true, user: decoded });
    } catch (err) {
        res.status(401).json({ valid: false });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // For testing purposes, allow any teacher login
        if (role === 'teacher') {
            if (email.endsWith('@bmsit.in')) {
                // Create or get mock teacher in database
                let mockTeacher = await User.findOne({ email, role });
                
                if (!mockTeacher) {
                    const teacherId = new mongoose.Types.ObjectId();
                    mockTeacher = new User({
                        _id: teacherId,
                        email,
                        role: 'teacher',
                        password: await bcrypt.hash('mockpassword', 10),
                        isOnboarded: false
                    });
                    await mockTeacher.save();
                }
                
                const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                
                return res.json({
                    token: 'mock-teacher-token-' + Date.now(),
                    user: {
                        id: mockTeacher._id.toString(),
                        role: 'teacher',
                        isOnboarded: false,
                        email: email,
                        sessionId: sessionId
                    }
                });
            } else {
                return res.status(400).json({ error: 'Teachers must use college email id' });
            }
        }

        const user = await User.findOne({ email, role });
        if (!user) {
            return res.status(400).json({ error: `No ${role} account found with this email.` });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                isOnboarded: user.isOnboarded,
            },
            process.env.SECRET_KEY,
            { expiresIn: '1d' },
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                role: user.role,
                isOnboarded: user.isOnboarded,
            },
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error during login' });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { email, password, role, semester, academicYear } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'User already exists' });

        const newUser = new User({
            email,
            password,
            role,
            semester: role === 'student' ? semester : undefined,
            academicYear: role === 'student' ? academicYear : undefined,
        });
        await newUser.save();

        res.status(201).json({
            message: 'User registered successfully!',
            id: newUser._id,
        });
    } catch (err) {
        console.error('Registration Error: ', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

router.patch('/onboarding/:id', async (req, res) => {
    try {
        const { name, branch, usn, section, semester, courses } = req.body;

        const updateData = {
            name,
            isOnboarded: true,
        };

        if (branch) updateData.branch = branch;
        if (usn) updateData.usn = usn;
        if (section) {
            updateData.section = section;
            updateData.$unset = { courses: 1 };
        } else if (courses) {
            updateData.courses = courses;
            updateData.$unset = { section: 1 };
        }
        if (semester) updateData.semester = semester;

        const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        });

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(updatedUser);
    } catch (err) {
        console.error('Onboarding Error:', err);
        res.status(500).json({ error: 'Server error during onboarding' });
    }
});

router.get('/profile/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).select('name role email usn sections branch courses');

        if (!user) {
            return res.status(404).json({ error: 'User profile not found' });
        }

        res.status(200).json(user);
    } catch (err) {
        console.error('Error fetching profile:', err);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ error: 'Invalid User ID format' });
        }
        res.status(500).json({ error: 'Server error fetching profile' });
    }
});

export default router;
