import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    studentName: {
        type: String,
        required: true,
    },
    usn: {
        type: String,
        required: true,
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    branch: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    section: {
        type: Number,
        required: true,
    },
    semester: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late'],
        default: 'Present',
    },
});

attendanceSchema.index({ teacherId: 1, subject: 1, section: 1, date: -1 });
attendanceSchema.index({ studentId: 1, subject: 1, date: 1 });

export default mongoose.model('Attendance', attendanceSchema);
