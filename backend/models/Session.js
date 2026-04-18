import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
    passkey: { type: String, required: true },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    branch: { type: String, required: true },
    subject: { type: String, required: true },
    section: { type: Number, required: true },
    semester: { type: Number, required: true },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    scanDevices: [
        {
            studentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
            deviceFingerprint: { type: String, required: true },
            scannedAt: { type: Date, default: Date.now },
        },
    ],
});

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);
