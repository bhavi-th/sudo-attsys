import { useState, useEffect } from 'react';
import '../styles/AssignmentsTab.css';

const AssignmentsTab = ({ teacherId }) => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, active, upcoming, overdue

    useEffect(() => {
        fetchAssignments();

        // Listen for assignment creation events
        const handleAssignmentCreated = () => {
            fetchAssignments();
        };

        // Listen for custom events from other components
        window.addEventListener('assignmentCreated', handleAssignmentCreated);
        window.addEventListener('assignmentUpdated', handleAssignmentCreated);

        // Set up periodic refresh (every 30 seconds)
        const refreshInterval = setInterval(fetchAssignments, 30000);

        return () => {
            window.removeEventListener('assignmentCreated', handleAssignmentCreated);
            window.removeEventListener('assignmentUpdated', handleAssignmentCreated);
            clearInterval(refreshInterval);
        };
    }, [teacherId]);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const API_BASE_URL = import.meta.env.VITE_PORT
                ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
                : import.meta.env.VITE_URL;

            const response = await fetch(`${API_BASE_URL}/api/assignments/teacher/${teacherId}`);
            
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

    const getStatusEmoji = (status) => {
        switch (status) {
            case 'active': return '✅';
            case 'expired': return '⏰';
            case 'draft': return '📝';
            default: return '📋';
        }
    };

    const getRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = date - now;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays === -1) return 'Yesterday';
        if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
        if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
        
        return formatDate(dateString);
    };

    const getFilteredAssignments = () => {
        const now = new Date();
        
        switch (filter) {
            case 'active':
                return assignments.filter(a => a.status === 'active');
            case 'upcoming':
                return assignments.filter(a => new Date(a.dueDate) > now && a.status === 'active');
            case 'overdue':
                return assignments.filter(a => isOverdue(a.dueDate) && a.status === 'active');
            default:
                return assignments;
        }
    };

    const filteredAssignments = getFilteredAssignments();
    const stats = {
        total: assignments.length,
        active: assignments.filter(a => a.status === 'active').length,
        overdue: assignments.filter(a => isOverdue(a.dueDate) && a.status === 'active').length,
        draft: assignments.filter(a => a.status === 'draft').length
    };

    if (loading) {
        return (
            <div className="assignments-tab">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading assignments...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="assignments-tab">
                <div className="error-state">
                    <p>Error: {error}</p>
                    <button onClick={fetchAssignments} className="retry-btn">Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="assignments-tab">
            {/* Header with Stats */}
            <div className="assignments-header">
                <h3 className="section-title">
                    <span className="section-icon">📚</span>
                    Assignments Overview
                </h3>
                <div className="assignments-stats">
                    <div className="stat-item">
                        <span className="stat-icon">📚</span>
                        <span className="stat-number">{stats.total}</span>
                        <span className="stat-label">Total</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-icon">✅</span>
                        <span className="stat-number">{stats.active}</span>
                        <span className="stat-label">Active</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-icon">⏰</span>
                        <span className="stat-number">{stats.overdue}</span>
                        <span className="stat-label">Overdue</span>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                {['all', 'active', 'upcoming', 'overdue'].map((filterType) => (
                    <button
                        key={filterType}
                        className={`filter-tab ${filter === filterType ? 'active' : ''}`}
                        onClick={() => setFilter(filterType)}
                    >
                        {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                        {filterType === 'all' && ` (${stats.total})`}
                        {filterType === 'active' && ` (${stats.active})`}
                        {filterType === 'upcoming' && ` (${assignments.filter(a => new Date(a.dueDate) > new Date() && a.status === 'active').length})`}
                        {filterType === 'overdue' && ` (${stats.overdue})`}
                    </button>
                ))}
            </div>

            {/* Assignments List */}
            <div className="assignments-list">
                {filteredAssignments.length === 0 ? (
                    <div className="empty-state">
                        <p>No assignments found</p>
                        {filter !== 'all' && (
                            <button onClick={() => setFilter('all')} className="show-all-btn">
                                Show all assignments
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="assignments-grid">
                        {filteredAssignments.map((assignment) => (
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
                                        <span className="status-emoji">{getStatusEmoji(assignment.status)}</span>
                                        {assignment.status}
                                    </span>
                                </div>
                                
                                <p className="assignment-description">
                                    {assignment.description.length > 100
                                        ? assignment.description.substring(0, 100) + '...'
                                        : assignment.description}
                                </p>
                                
                                <div className="assignment-meta">
                                    <div className="meta-item">
                                        <span className="meta-label">Subject:</span>
                                        <span className="meta-value">{'\ud83d\udcd6'} {assignment.subject}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Section:</span>
                                        <span className="meta-value">{'\ud83d\udc65'} {assignment.section}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Semester:</span>
                                        <span className="meta-value">{'\ud83d\udcc5'} {assignment.semester}</span>
                                    </div>
                                </div>
                                
                                <div className="assignment-footer">
                                    <div className="due-date">
                                        <span className="due-label">Due:</span>
                                        <span className={`due-value ${isOverdue(assignment.dueDate) ? 'overdue' : ''}`}>
                                            {isOverdue(assignment.dueDate) ? '\u23f0' : '\ud83d\udcc5'} {getRelativeTime(assignment.dueDate)}
                                        </span>
                                    </div>
                                    {assignment.submissions && (
                                        <div className="submissions-count">
                                            <span className="submissions-label">Submissions:</span>
                                            <span className="submissions-value">
                                                {'\ud83d\udcdd'} {assignment.submissions.length}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Refresh Button */}
            <div className="assignments-footer">
                <button onClick={fetchAssignments} className="refresh-btn">
                    Refresh Assignments
                </button>
            </div>
        </div>
    );
};

export default AssignmentsTab;
