import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher'], required: true },
    name: { type: String },
    branch: { type: String },
    academicYear: { type: Number },
    semester: { type: Number },
    isOnboarded: { type: Boolean, default: false },
    usn: { type: String },
    section: { type: Number },
    courses: {
        type: [
            {
                subject: { type: String },
                sections: [{ type: Number }],
                semester: { type: Number },
            },
        ],
        default: undefined,
    },
});

UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

export default mongoose.model('User', UserSchema);
