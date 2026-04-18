import { useState, useEffect } from 'react';
import '../styles/StudentAssignments.css';

const StudentAssignments = ({ studentData }) => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStudentAssignments();
    }, [studentData]);

    const fetchStudentAssignments = async () => {
        if (!studentData) return;

        try {
            setLoading(true);
            const API_BASE_URL = import.meta.env.VITE_PORT
                ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
                : import.meta.env.VITE_URL;

            // Fetch assignments for this student's section and semester
            const response = await fetch(
                `${API_BASE_URL}/api/assignments/student/${studentData.student_id}?section=${studentData.section}&semester=${studentData.semester || '1'}`
            );
            
            if (response.ok) {
                const data = await response.json();
                setAssignments(data);
                setError(null);
            } else {
                const err = await response.json();
                setError(err.error || 'Failed to fetch assignments');
            }
        } catch (error) {
            console.error('Error fetching assignments:', error);
            setError('Connection error fetching assignments');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const isOverdue = (dueDate) => {
        return new Date(dueDate) < new Date();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return '#10b981';
            case 'expired': return '#ef4444';
            case 'draft': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    const getDaysUntilDue = (dueDate) => {
        const now = new Date();
        const due = new Date(dueDate);
        const diffTime = due - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
        if (diffDays === 0) return 'Due today';
        if (diffDays === 1) return 'Due tomorrow';
        return `${diffDays} days left`;
    };

    if (loading) {
        return (
            <div className="student-assignments">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading assignments...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="student-assignments">
                <div className="error-state">
                    <p>Error: {error}</p>
                    <button onClick={fetchStudentAssignments} className="retry-btn">Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="student-assignments">
            {/* Header */}
            <div className="assignments-header">
                <h3 className="section-title">My Assignments</h3>
                <div className="assignments-stats">
                    <div className="stat-item">
                        <span className="stat-number">{assignments.length}</span>
                        <span className="stat-label">Total</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{assignments.filter(a => isOverdue(a.dueDate)).length}</span>
                        <span className="stat-label">Overdue</span>
                    </div>
                </div>
            </div>

            {/* Assignments List */}
            <div className="assignments-list">
                {assignments.length === 0 ? (
                    <div className="empty-state">
                        <p>No assignments found for your section</p>
                    </div>
                ) : (
                    <div className="assignments-grid">
                        {assignments.map((assignment) => (
                            <div
                                key={assignment._id}
                                className={`assignment-card ${isOverdue(assignment.dueDate) ? 'overdue' : ''}`}
                            >
                                <div className="assignment-header">
                                    <h4 className="assignment-title">{assignment.title}</h4>
                                    <span
                                        className="status-badge"
                                        style={{ backgroundColor: getStatusColor(assignment.status) }}
                                    >
                                        {assignment.status}
                                    </span>
                                </div>
                                
                                <p className="assignment-description">
                                    {assignment.description.length > 120
                                        ? assignment.description.substring(0, 120) + '...'
                                        : assignment.description}
                                </p>
                                
                                <div className="assignment-meta">
                                    <div className="meta-item">
                                        <span className="meta-label">Subject:</span>
                                        <span className="meta-value">{assignment.subject}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Teacher:</span>
                                        <span className="meta-value">{assignment.teacherName}</span>
                                    </div>
                                </div>
                                
                                <div className="assignment-footer">
                                    <div className="due-info">
                                        <span className="due-label">Due:</span>
                                        <span className={`due-value ${isOverdue(assignment.dueDate) ? 'overdue' : ''}`}>
                                            {formatDate(assignment.dueDate)}
                                        </span>
                                        <span className={`days-left ${isOverdue(assignment.dueDate) ? 'overdue' : ''}`}>
                                            {getDaysUntilDue(assignment.dueDate)}
                                        </span>
                                    </div>
                                    <button className="submit-btn">
                                        Submit Assignment
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentAssignments;
