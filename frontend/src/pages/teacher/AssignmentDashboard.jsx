import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import '../../styles/teacher/AssignmentDashboard.css';

const AssignmentDashboard = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [assignments, setAssignments] = useState([]);
    const [filteredAssignments, setFilteredAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('dueDate');
    const [sortOrder, setSortOrder] = useState('asc');
    const [filter, setFilter] = useState({
        subject: '',
        section: '',
        semester: '',
        status: ''
    });
    const [hoveredCard, setHoveredCard] = useState(null);
    const [selectedAssignments, setSelectedAssignments] = useState(new Set());
    const [showStats, setShowStats] = useState(true);
    const [previewAssignment, setPreviewAssignment] = useState(null);
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [quickEditTitle, setQuickEditTitle] = useState('');
    const [quickEditDescription, setQuickEditDescription] = useState('');
    const [showExportModal, setShowExportModal] = useState(false);

    useEffect(() => {
        fetchAssignments();
    }, [id]);

    useEffect(() => {
        filterAndSortAssignments();
    }, [assignments, searchTerm, sortBy, sortOrder, filter]);

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

    const filterAndSortAssignments = () => {
        let filtered = assignments;

        // Apply search
        if (searchTerm) {
            filtered = filtered.filter(assignment =>
                assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                assignment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                assignment.subject.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply filters
        Object.entries(filter).forEach(([key, value]) => {
            if (value) {
                filtered = filtered.filter(assignment =>
                    assignment[key]?.toString().toLowerCase().includes(value.toLowerCase())
                );
            }
        });

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            if (sortBy === 'dueDate') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        setFilteredAssignments(filtered);
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

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active': return '✅';
            case 'expired': return '⏰';
            case 'draft': return '📝';
            default: return '📋';
        }
    };

    const toggleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const toggleSelection = (assignmentId) => {
        const newSelection = new Set(selectedAssignments);
        if (newSelection.has(assignmentId)) {
            newSelection.delete(assignmentId);
        } else {
            newSelection.add(assignmentId);
        }
        setSelectedAssignments(newSelection);
    };

    const handleBulkDelete = async () => {
        if (selectedAssignments.size === 0) return;
        
        if (!window.confirm(`Are you sure you want to delete ${selectedAssignments.size} assignment(s)?`)) {
            return;
        }

        try {
            const API_BASE_URL = import.meta.env.VITE_PORT
                ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
                : import.meta.env.VITE_URL;

            const deletePromises = Array.from(selectedAssignments).map(assignmentId =>
                fetch(`${API_BASE_URL}/api/assignments/${assignmentId}`, { method: 'DELETE' })
            );

            await Promise.all(deletePromises);
            setSelectedAssignments(new Set());
            fetchAssignments();
        } catch (error) {
            console.error('Error bulk deleting assignments:', error);
            alert('Error deleting assignments');
        }
    };

    const clearFilters = () => {
        setFilter({
            subject: '',
            section: '',
            semester: '',
            status: ''
        });
        setSearchTerm('');
    };

    const hasActiveFilters = searchTerm || Object.values(filter).some(val => val);

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

    const getAssignmentStats = () => {
        const total = assignments.length;
        const active = assignments.filter(a => a.status === 'active').length;
        const expired = assignments.filter(a => a.status === 'expired').length;
        const draft = assignments.filter(a => a.status === 'draft').length;
        const overdue = assignments.filter(a => isOverdue(a.dueDate)).length;
        
        return { total, active, expired, draft, overdue };
    };

    const handleQuickEdit = (assignment) => {
        setEditingAssignment(assignment._id);
        setQuickEditTitle(assignment.title);
        setQuickEditDescription(assignment.description);
    };

    const saveQuickEdit = async (assignmentId) => {
        try {
            const API_BASE_URL = import.meta.env.VITE_PORT
                ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
                : import.meta.env.VITE_URL;

            const response = await fetch(`${API_BASE_URL}/api/assignments/${assignmentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: quickEditTitle,
                    description: quickEditDescription
                })
            });

            if (response.ok) {
                fetchAssignments();
                setEditingAssignment(null);
            } else {
                alert('Failed to update assignment');
            }
        } catch (error) {
            console.error('Error updating assignment:', error);
            alert('Error updating assignment');
        }
    };

    const cancelQuickEdit = () => {
        setEditingAssignment(null);
        setQuickEditTitle('');
        setQuickEditDescription('');
    };

    const duplicateAssignment = async (assignment) => {
        try {
            const API_BASE_URL = import.meta.env.VITE_PORT
                ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
                : import.meta.env.VITE_URL;

            const response = await fetch(`${API_BASE_URL}/api/assignments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...assignment,
                    title: `${assignment.title} (Copy)`,
                    status: 'draft'
                })
            });

            if (response.ok) {
                fetchAssignments();
            } else {
                alert('Failed to duplicate assignment');
            }
        } catch (error) {
            console.error('Error duplicating assignment:', error);
            alert('Error duplicating assignment');
        }
    };

    const exportAssignments = (format) => {
        const data = filteredAssignments.map(a => ({
            Title: a.title,
            Description: a.description,
            Subject: a.subject,
            Section: a.section,
            Semester: a.semester,
            Status: a.status,
            'Due Date': formatDate(a.dueDate)
        }));

        if (format === 'csv') {
            const csv = [
                Object.keys(data[0]).join(','),
                ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
            ].join('\n');
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'assignments.csv';
            a.click();
        } else if (format === 'json') {
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'assignments.json';
            a.click();
        }
        
        setShowExportModal(false);
    };

    if (loading) {
        return (
            <div className="assignment-dashboard loading-state">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <div className="loading-text">Loading assignments...</div>
                    <div className="loading-subtitle">Please wait while we fetch your assignments</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="assignment-dashboard error-state">
                <div className="error-container">
                    <div className="error-icon">⚠️</div>
                    <h2 className="error-title">Something went wrong</h2>
                    <p className="error-message">{error}</p>
                    <div className="error-actions">
                        <button onClick={fetchAssignments} className="retry-btn">
                            <span className="btn-icon">🔄</span>
                            Try Again
                        </button>
                        <button onClick={() => setError(null)} className="dismiss-btn">
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="assignment-dashboard">
            <div className="dashboard-container">
                {/* Header */}
                <header className="dashboard-header">
                    <div className="header-content">
                        <h1 className="dashboard-title">
                            <span className="title-icon">📚</span>
                            Assignment Management
                        </h1>
                        <div className="header-stats">
                            <div className="stat-item">
                                <span className="stat-number">{assignments.length}</span>
                                <span className="stat-label">Total</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">{assignments.filter(a => a.status === 'active').length}</span>
                                <span className="stat-label">Active</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">{assignments.filter(a => isOverdue(a.dueDate)).length}</span>
                                <span className="stat-label">Overdue</span>
                            </div>
                            <button
                                onClick={() => setShowStats(!showStats)}
                                className="stats-toggle-btn"
                                aria-label="Toggle statistics view"
                            >
                                <span className="btn-icon">📊</span>
                                {showStats ? 'Hide' : 'Show'} Stats
                            </button>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button
                            onClick={() => setShowExportModal(true)}
                            className="export-btn"
                            disabled={filteredAssignments.length === 0}
                        >
                            <span className="btn-icon">📤</span>
                            Export
                        </button>
                        <Link to={`/dash/teacher/${id}/create-assignment`}>
                            <button className="create-btn">
                                <span className="btn-icon">➕</span>
                                Create New Assignment
                            </button>
                        </Link>
                    </div>
                </header>

                {/* Statistics Visualization */}
                {showStats && assignments.length > 0 && (
                    <section className="stats-section">
                        <h3 className="section-title">
                            <span className="section-icon">📊</span>
                            Assignment Overview
                        </h3>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-header">
                                    <span className="stat-icon">📚</span>
                                    <span className="stat-title">Total Assignments</span>
                                </div>
                                <div className="stat-value">{assignments.length}</div>
                                <div className="stat-progress">
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill total"
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="stat-card">
                                <div className="stat-header">
                                    <span className="stat-icon">✅</span>
                                    <span className="stat-title">Active</span>
                                </div>
                                <div className="stat-value">{assignments.filter(a => a.status === 'active').length}</div>
                                <div className="stat-progress">
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill active"
                                            style={{ width: `${(assignments.filter(a => a.status === 'active').length / assignments.length) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="stat-card">
                                <div className="stat-header">
                                    <span className="stat-icon">⏰</span>
                                    <span className="stat-title">Overdue</span>
                                </div>
                                <div className="stat-value">{assignments.filter(a => isOverdue(a.dueDate)).length}</div>
                                <div className="stat-progress">
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill overdue"
                                            style={{ width: `${(assignments.filter(a => isOverdue(a.dueDate)).length / assignments.length) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="stat-card">
                                <div className="stat-header">
                                    <span className="stat-icon">📝</span>
                                    <span className="stat-title">Draft</span>
                                </div>
                                <div className="stat-value">{assignments.filter(a => a.status === 'draft').length}</div>
                                <div className="stat-progress">
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill draft"
                                            style={{ width: `${(assignments.filter(a => a.status === 'draft').length / assignments.length) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Search and Sort Bar */}
                <section className="search-sort-section">
                    <div className="search-container">
                        <div className="search-input-wrapper">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Search assignments by title, description, or subject..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                                aria-label="Search assignments"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="clear-search-btn"
                                    aria-label="Clear search"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="sort-controls">
                        <label className="sort-label">Sort by:</label>
                        <div className="sort-buttons">
                            {['dueDate', 'title', 'status', 'subject'].map(field => (
                                <button
                                    key={field}
                                    onClick={() => toggleSort(field)}
                                    className={`sort-btn ${sortBy === field ? 'active' : ''}`}
                                    aria-label={`Sort by ${field}`}
                                >
                                    {field === 'dueDate' ? 'Due Date' : field.charAt(0).toUpperCase() + field.slice(1)}
                                    {sortBy === field && (
                                        <span className="sort-arrow">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Filters */}
                <section className="filters-section">
                    <div className="filters-header">
                        <h3 className="section-title">
                            <span className="section-icon">🎯</span>
                            Filter Assignments
                        </h3>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="clear-filters-btn">
                                <span className="btn-icon">🔄</span>
                                Clear All
                            </button>
                        )}
                    </div>
                    
                    <div className="filter-grid">
                        <div className="filter-group">
                            <label htmlFor="subject">Subject</label>
                            <div className="input-wrapper">
                                <span className="input-icon">📖</span>
                                <input
                                    id="subject"
                                    name="subject"
                                    type="text"
                                    placeholder="Filter by subject"
                                    value={filter.subject}
                                    onChange={handleFilterChange}
                                    className="filter-input"
                                />
                                {filter.subject && (
                                    <button
                                        onClick={() => setFilter(prev => ({ ...prev, subject: '' }))}
                                        className="clear-input-btn"
                                        aria-label="Clear subject filter"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="filter-group">
                            <label htmlFor="section">Section</label>
                            <div className="input-wrapper">
                                <span className="input-icon">👥</span>
                                <input
                                    id="section"
                                    name="section"
                                    type="text"
                                    placeholder="Filter by section"
                                    value={filter.section}
                                    onChange={handleFilterChange}
                                    className="filter-input"
                                />
                                {filter.section && (
                                    <button
                                        onClick={() => setFilter(prev => ({ ...prev, section: '' }))}
                                        className="clear-input-btn"
                                        aria-label="Clear section filter"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="filter-group">
                            <label htmlFor="semester">Semester</label>
                            <div className="input-wrapper">
                                <span className="input-icon">📅</span>
                                <input
                                    id="semester"
                                    name="semester"
                                    type="text"
                                    placeholder="Filter by semester"
                                    value={filter.semester}
                                    onChange={handleFilterChange}
                                    className="filter-input"
                                />
                                {filter.semester && (
                                    <button
                                        onClick={() => setFilter(prev => ({ ...prev, semester: '' }))}
                                        className="clear-input-btn"
                                        aria-label="Clear semester filter"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="filter-group">
                            <label htmlFor="status">Status</label>
                            <div className="input-wrapper">
                                <span className="input-icon">🏷️</span>
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
                </section>

                {/* Bulk Actions */}
                {selectedAssignments.size > 0 && (
                    <section className="bulk-actions-section">
                        <div className="bulk-actions-content">
                            <span className="bulk-info">
                                {selectedAssignments.size} assignment{selectedAssignments.size > 1 ? 's' : ''} selected
                            </span>
                            <div className="bulk-buttons">
                                <button
                                    onClick={() => setSelectedAssignments(new Set())}
                                    className="bulk-deselect-btn"
                                >
                                    Deselect All
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="bulk-delete-btn"
                                >
                                    <span className="btn-icon">🗑️</span>
                                    Delete Selected
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* Assignments List */}
                <main className="assignments-section">
                    <div className="assignments-header">
                        <h3 className="section-title">
                            <span className="section-icon">📋</span>
                            Assignments ({filteredAssignments.length})
                        </h3>
                        {filteredAssignments.length !== assignments.length && (
                            <span className="filtered-info">
                                {assignments.length - filteredAssignments.length} filtered out
                            </span>
                        )}
                    </div>
                    
                    {filteredAssignments.length > 0 ? (
                        <div className="assignments-grid">
                            {filteredAssignments.map((assignment) => (
                                <article 
                                    key={assignment._id} 
                                    className={`assignment-card ${
                                        isOverdue(assignment.dueDate) ? 'overdue' : ''
                                    } ${
                                        selectedAssignments.has(assignment._id) ? 'selected' : ''
                                    } ${
                                        hoveredCard === assignment._id ? 'hovered' : ''
                                    }`}
                                    onMouseEnter={() => setHoveredCard(assignment._id)}
                                    onMouseLeave={() => setHoveredCard(null)}
                                >
                                    <div className="card-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedAssignments.has(assignment._id)}
                                            onChange={() => toggleSelection(assignment._id)}
                                            className="checkbox-input"
                                            aria-label={`Select ${assignment.title}`}
                                        />
                                    </div>
                                    
                                    <div className="card-header">
                                        <div className="title-section">
                                            <h4 className="assignment-title">
                                                {assignment.title}
                                            </h4>
                                            <div className="card-badges">
                                                <span 
                                                    className="status-badge"
                                                    style={{ backgroundColor: getStatusColor(assignment.status) }}
                                                >
                                                    <span className="status-icon">{getStatusIcon(assignment.status)}</span>
                                                    {assignment.status}
                                                </span>
                                                {isOverdue(assignment.dueDate) && (
                                                    <span className="overdue-badge">
                                                        <span className="overdue-icon">⏰</span>
                                                        Overdue
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="card-content">
                                        <p className="assignment-description">
                                            {assignment.description.substring(0, 120)}
                                            {assignment.description.length > 120 ? '...' : ''}
                                        </p>
                                        
                                        <div className="assignment-meta">
                                            <div className="meta-item">
                                                <span className="meta-icon">📖</span>
                                                <span className="meta-label">Subject:</span>
                                                <span className="meta-value">{assignment.subject}</span>
                                            </div>
                                            <div className="meta-item">
                                                <span className="meta-icon">👥</span>
                                                <span className="meta-label">Section:</span>
                                                <span className="meta-value">{assignment.section}</span>
                                            </div>
                                            <div className="meta-item">
                                                <span className="meta-icon">📅</span>
                                                <span className="meta-label">Semester:</span>
                                                <span className="meta-value">{assignment.semester}</span>
                                            </div>
                                            <div className={`meta-item ${isOverdue(assignment.dueDate) ? 'overdue' : ''}`}>
                                                <span className="meta-icon">⏰</span>
                                                <span className="meta-label">Due:</span>
                                                <div className="meta-value-group">
                                                    <span className="meta-value">
                                                        {getRelativeTime(assignment.dueDate)}
                                                    </span>
                                                    <span className="meta-date">
                                                        {formatDate(assignment.dueDate)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="card-actions">
                                        <button
                                            onClick={() => setPreviewAssignment(assignment)}
                                            className="preview-btn"
                                            aria-label={`Preview ${assignment.title}`}
                                        >
                                            <span className="btn-icon">👁️</span>
                                            Preview
                                        </button>
                                        <button
                                            onClick={() => handleQuickEdit(assignment)}
                                            className="quick-edit-btn"
                                            aria-label={`Quick edit ${assignment.title}`}
                                        >
                                            <span className="btn-icon">✏️</span>
                                            Quick Edit
                                        </button>
                                        <button
                                            onClick={() => duplicateAssignment(assignment)}
                                            className="duplicate-btn"
                                            aria-label={`Duplicate ${assignment.title}`}
                                        >
                                            <span className="btn-icon">📋</span>
                                            Duplicate
                                        </button>
                                        <button
                                            onClick={() => navigate(`/dash/teacher/${id}/edit-assignment/${assignment._id}`)}
                                            className="edit-btn"
                                            aria-label={`Edit ${assignment.title}`}
                                        >
                                            <span className="btn-icon">⚙️</span>
                                            Full Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteAssignment(assignment._id)}
                                            className="delete-btn"
                                            aria-label={`Delete ${assignment.title}`}
                                        >
                                            <span className="btn-icon">🗑️</span>
                                            Delete
                                        </button>
                                    </div>
                                    
                                    {/* Quick Edit Section */}
                                    {editingAssignment === assignment._id && (
                                        <div className="quick-edit-section">
                                            <div className="quick-edit-header">
                                                <h4>Quick Edit</h4>
                                                <button
                                                    onClick={cancelQuickEdit}
                                                    className="cancel-edit-btn"
                                                    aria-label="Cancel edit"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            <div className="quick-edit-form">
                                                <input
                                                    type="text"
                                                    value={quickEditTitle}
                                                    onChange={(e) => setQuickEditTitle(e.target.value)}
                                                    placeholder="Assignment title"
                                                    className="quick-edit-input"
                                                />
                                                <textarea
                                                    value={quickEditDescription}
                                                    onChange={(e) => setQuickEditDescription(e.target.value)}
                                                    placeholder="Assignment description"
                                                    className="quick-edit-textarea"
                                                    rows="3"
                                                />
                                                <div className="quick-edit-actions">
                                                    <button
                                                        onClick={cancelQuickEdit}
                                                        className="cancel-btn"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => saveQuickEdit(assignment._id)}
                                                        className="save-btn"
                                                    >
                                                        Save Changes
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="no-assignments">
                            <div className="no-data-icon">
                                {hasActiveFilters ? '🔍' : '📋'}
                            </div>
                            <h3>
                                {hasActiveFilters ? 'No assignments match your filters' : 'No assignments found'}
                            </h3>
                            <p>
                                {hasActiveFilters 
                                    ? 'Try adjusting your filters or search terms to see more results.'
                                    : 'Start by creating your first assignment.'
                                }
                            </p>
                            <div className="no-assignments-actions">
                                {hasActiveFilters && (
                                    <button onClick={clearFilters} className="secondary-btn">
                                        Clear Filters
                                    </button>
                                )}
                                {!hasActiveFilters && (
                                    <Link to={`/dash/teacher/${id}/create-assignment`}>
                                        <button className="create-btn">
                                            <span className="btn-icon">➕</span>
                                            Create Your First Assignment
                                        </button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>
            
            {/* Preview Modal */}
            {previewAssignment && (
                <div className="modal-overlay" onClick={() => setPreviewAssignment(null)}>
                    <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Assignment Preview</h3>
                            <button
                                onClick={() => setPreviewAssignment(null)}
                                className="modal-close-btn"
                                aria-label="Close preview"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-content">
                            <div className="preview-section">
                                <h4>{previewAssignment.title}</h4>
                                <div className="preview-badges">
                                    <span 
                                        className="status-badge"
                                        style={{ backgroundColor: getStatusColor(previewAssignment.status) }}
                                    >
                                        <span className="status-icon">{getStatusIcon(previewAssignment.status)}</span>
                                        {previewAssignment.status}
                                    </span>
                                    {isOverdue(previewAssignment.dueDate) && (
                                        <span className="overdue-badge">
                                            <span className="overdue-icon">⏰</span>
                                            Overdue
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="preview-section">
                                <h5>Description</h5>
                                <p>{previewAssignment.description}</p>
                            </div>
                            
                            <div className="preview-section">
                                <h5>Details</h5>
                                <div className="preview-meta">
                                    <div className="preview-meta-item">
                                        <span className="meta-icon">📖</span>
                                        <span className="meta-label">Subject:</span>
                                        <span className="meta-value">{previewAssignment.subject}</span>
                                    </div>
                                    <div className="preview-meta-item">
                                        <span className="meta-icon">👥</span>
                                        <span className="meta-label">Section:</span>
                                        <span className="meta-value">{previewAssignment.section}</span>
                                    </div>
                                    <div className="preview-meta-item">
                                        <span className="meta-icon">📅</span>
                                        <span className="meta-label">Semester:</span>
                                        <span className="meta-value">{previewAssignment.semester}</span>
                                    </div>
                                    <div className="preview-meta-item">
                                        <span className="meta-icon">⏰</span>
                                        <span className="meta-label">Due Date:</span>
                                        <span className="meta-value">{formatDate(previewAssignment.dueDate)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button
                                onClick={() => {
                                    setPreviewAssignment(null);
                                    navigate(`/dash/teacher/${id}/edit-assignment/${previewAssignment._id}`);
                                }}
                                className="edit-btn"
                            >
                                <span className="btn-icon">✏️</span>
                                Edit Assignment
                            </button>
                            <button
                                onClick={() => setPreviewAssignment(null)}
                                className="secondary-btn"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Export Modal */}
            {showExportModal && (
                <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
                    <div className="export-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Export Assignments</h3>
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="modal-close-btn"
                                aria-label="Close export modal"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-content">
                            <p>Export {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''} in your preferred format:</p>
                            <div className="export-options">
                                <button
                                    onClick={() => exportAssignments('csv')}
                                    className="export-option-btn"
                                >
                                    <span className="export-icon">📊</span>
                                    <div className="export-option-content">
                                        <h4>CSV Format</h4>
                                        <p>Perfect for spreadsheet applications</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => exportAssignments('json')}
                                    className="export-option-btn"
                                >
                                    <span className="export-icon">🔧</span>
                                    <div className="export-option-content">
                                        <h4>JSON Format</h4>
                                        <p>For data processing and backup</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="secondary-btn"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignmentDashboard;
