import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import attendanceRoutes from './routes/attendance.js';
import qrRouter from './routes/qr.js';
import riskRoutes from './routes/risk.js';
import assignmentRoutes from './routes/assignments.js';

dotenv.config();
const app = express();

const origins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];

app.use(
    cors({
        origin: origins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    }),
);
app.use(express.json());

const PORT = process.env.PORT || 5000;

const HOST = '0.0.0.0';

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.log('❌ Connection error:', err));

app.use('/', qrRouter);
app.use('/api', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/assignments', assignmentRoutes);

app.listen(PORT, HOST, () => console.log('🚀 Server running on port 5000'));
