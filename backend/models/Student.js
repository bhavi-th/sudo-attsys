import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
    student_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    stream: { type: String, required: true, enum: ['CSE', 'ECE', 'ME', 'CE', 'EEE', 'IT'] },
    section: { type: String, required: true, enum: ['A', 'B', 'C', 'D'] },
    attendance: { type: Number, min: 0, max: 100, required: true },
    marks: { type: Number, min: 0, max: 100, required: true },
    engagement: { type: Number, min: 0, max: 100, required: true },
    assignments: { type: Number, min: 0, max: 100, required: true },
    archetype: { type: String, required: true },
    characteristics: { type: String, required: true },
    aiInsights: {
        riskLevel: { type: String, enum: ['Low', 'Medium', 'High'] },
        insights: [String],
        focusAreas: [String],
        potential: String
    },
    teacherSession: { type: String, required: true }, // Track which teacher session created this student
    generatedAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now }
});

studentSchema.index({ student_id: 1 });
studentSchema.index({ generatedAt: -1 });
studentSchema.index({ teacherSession: 1 });
studentSchema.index({ stream: 1, section: 1 });

export default mongoose.model('Student', studentSchema);
