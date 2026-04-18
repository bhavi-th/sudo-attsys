import mongoose from 'mongoose';

const AssignmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    subject: { type: String, required: true },
    section: { type: String, required: true },
    semester: { type: String, required: true },
    dueDate: { type: Date, required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teacherName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    status: { 
        type: String, 
        enum: ['active', 'expired', 'draft'], 
        default: 'active' 
    },
    submissions: [{
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        studentName: { type: String },
        studentEmail: { type: String },
        submittedAt: { type: Date },
        fileUrl: { type: String },
        fileName: { type: String },
        score: { type: Number },
        feedback: { type: String },
        status: { 
            type: String, 
            enum: ['submitted', 'graded', 'late'], 
            default: 'submitted' 
        }
    }]
});

// Note: updatedAt is automatically handled by default: Date.now

// Method to check if assignment is expired
AssignmentSchema.methods.isExpired = function() {
    return new Date() > this.dueDate;
};

// Method to get submission count
AssignmentSchema.methods.getSubmissionCount = function() {
    return this.submissions.length;
};

// Method to get pending submissions count
AssignmentSchema.methods.getPendingCount = function() {
    return this.submissions.filter(sub => sub.status === 'submitted').length;
};

const Assignment = mongoose.model('Assignment', AssignmentSchema);
export default Assignment;
