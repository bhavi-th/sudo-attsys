import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import '../../styles/teacher/AssignmentDashboard.css';

const AssignmentDashboard = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState({
        subject: '',
        section: '',
        semester: '',
        status: ''
    });

    useEffect(() => {
        fetchAssignments();
    }, [id, filter]);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const API_BASE_URL = import.meta.env.VITE_PORT
                ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
                : import.meta.env.VITE_URL;

            const queryParams = new URLSearchParams();
            Object.entries(filter).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });

            const response = await fetch(
                `${API_BASE_URL}/api/assignments/teacher/${id}?${queryParams.toString()}`
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

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilter(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDeleteAssignment = async (assignmentId) => {
        if (!window.confirm('Are you sure you want to delete this assignment?')) {
            return;
        }

        try {
            const API_BASE_URL = import.meta.env.VITE_PORT
                ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
                : import.meta.env.VITE_URL;

            const response = await fetch(
                `${API_BASE_URL}/api/assignments/${assignmentId}`,
                { method: 'DELETE' }
            );

            if (response.ok) {
                fetchAssignments(); // Refresh the list
            } else {
                const err = await response.json();
                alert(`Failed to delete assignment: ${err.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting assignment:', error);
            alert('Error deleting assignment');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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

    if (loading) {
        return (
            <div className="assignment-dashboard">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading assignments...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="assignment-dashboard">
                <div className="error-container">
                    <p className="error-message">{error}</p>
                    <button onClick={fetchAssignments} className="retry-btn">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="assignment-dashboard">
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <h1 className="dashboard-title">Assignment Management</h1>
                    <Link to={`/dash/teacher/${id}/create-assignment`}>
                        <button className="create-btn">
                            + Create New Assignment
                        </button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="filters-section">
                    <h3 className="section-title">Filter Assignments</h3>
                    <div className="filter-grid">
                        <div className="filter-group">
                            <label htmlFor="subject">Subject</label>
                            <input
                                id="subject"
                                name="subject"
                                type="text"
                                placeholder="Filter by subject"
                                value={filter.subject}
                                onChange={handleFilterChange}
                                className="filter-input"
                            />
                        </div>
                        <div className="filter-group">
                            <label htmlFor="section">Section</label>
                            <input
                                id="section"
                                name="section"
                                type="text"
                                placeholder="Filter by section"
                                value={filter.section}
                                onChange={handleFilterChange}
                                className="filter-input"
                            />
                        </div>
                        <div className="filter-group">
                            <label htmlFor="semester">Semester</label>
                            <input
                                id="semester"
                                name="semester"
                                type="text"
                                placeholder="Filter by semester"
                                value={filter.semester}
                                onChange={handleFilterChange}
                                className="filter-input"
                            />
                        </div>
                        <div className="filter-group">
                            <label htmlFor="status">Status</label>
                            <select
                                id="status"
                                name="status"
                                value={filter.status}
                                onChange={handleFilterChange}
                                className="filter-select"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="expired">Expired</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Assignments List */}
                <div className="assignments-section">
                    <h3 className="section-title">
                        Assignments ({assignments.length})
                    </h3>
                    
                    {assignments.length > 0 ? (
                        <div className="assignments-grid">
                            {assignments.map((assignment) => (
                                <div 
                                    key={assignment._id} 
                                    className={`assignment-card ${isOverdue(assignment.dueDate) ? 'overdue' : ''}`}
                                >
                                    <div className="card-header">
                                        <h4 className="assignment-title">
                                            {assignment.title}
                                        </h4>
                                        <span 
                                            className="status-badge"
                                            style={{ backgroundColor: getStatusColor(assignment.status) }}
                                        >
                                            {assignment.status}
                                        </span>
                                    </div>
                                    
                                    <div className="card-content">
                                        <p className="assignment-description">
                                            {assignment.description.substring(0, 100)}
                                            {assignment.description.length > 100 ? '...' : ''}
                                        </p>
                                        
                                        <div className="assignment-meta">
                                            <div className="meta-item">
                                                <span className="meta-label">Subject:</span>
                                                <span className="meta-value">{assignment.subject}</span>
                                            </div>
                                            <div className="meta-item">
                                                <span className="meta-label">Section:</span>
                                                <span className="meta-value">{assignment.section}</span>
                                            </div>
                                            <div className="meta-item">
                                                <span className="meta-label">Semester:</span>
                                                <span className="meta-value">{assignment.semester}</span>
                                            </div>
                                            <div className={`meta-item ${isOverdue(assignment.dueDate) ? 'overdue' : ''}`}>
                                                <span className="meta-label">Due:</span>
                                                <span className="meta-value">
                                                    {formatDate(assignment.dueDate)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="card-actions">
                                        <button
                                            onClick={() => navigate(`/dash/teacher/${id}/assignment/${assignment._id}`)}
                                            className="view-btn"
                                        >
                                            View Details
                                        </button>
                                        <button
                                            onClick={() => navigate(`/dash/teacher/${id}/edit-assignment/${assignment._id}`)}
                                            className="edit-btn"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteAssignment(assignment._id)}
                                            className="delete-btn"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-assignments">
                            <div className="no-data-icon">📋</div>
                            <h3>No assignments found</h3>
                            <p>
                                {Object.values(filter).some(val => val) 
                                    ? 'Try adjusting your filters to see more results.'
                                    : 'Start by creating your first assignment.'
                                }
                            </p>
                            {!Object.values(filter).some(val => val) && (
                                <Link to={`/dash/teacher/${id}/create-assignment`}>
                                    <button className="create-btn">
                                        Create Your First Assignment
                                    </button>
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssignmentDashboard;
