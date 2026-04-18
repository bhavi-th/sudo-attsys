import { useState, useEffect } from 'react';
import '../styles/StudentAnalytics.css';

const StudentAnalytics = ({ sessionId }) => {
    console.log('StudentAnalytics received sessionId:', sessionId);
    const [students, setStudents] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [clearing, setClearing] = useState(false);

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                const API_BASE_URL = import.meta.env.VITE_PORT
                    ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
                    : import.meta.env.VITE_URL;

                // Fetch all students (including fake ones) - don't filter by sessionId
                const studentsUrl = `${API_BASE_URL}/api/analyzer/students`;
                    
                const [studentsResponse, summaryResponse] = await Promise.all([
                    fetch(studentsUrl),
                    fetch(`${API_BASE_URL}/api/analyzer/summary`)
                ]);

                if (!studentsResponse.ok || !summaryResponse.ok) {
                    throw new Error('Failed to fetch student data');
                }

                const studentsData = await studentsResponse.json();
                const summaryData = await summaryResponse.json();

                setStudents(studentsData.data || []);
                setSummary(summaryData.data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchStudentData();
    }, [sessionId]);

    const clearStudents = async () => {
        console.log('Clear students called, sessionId:', sessionId);
        
        console.log('Starting to clear students...');
        setClearing(true);
        try {
            const API_BASE_URL = import.meta.env.VITE_PORT
                ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
                : import.meta.env.VITE_URL;

            // Clear all students (including fake ones)
            const response = await fetch(`${API_BASE_URL}/api/analyzer/clear-all`, {
                method: 'DELETE'
            });

            console.log('Clear response status:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('Clear response data:', result);
                setStudents([]);
                setSummary(null);
                console.log('Students cleared successfully');
            } else {
                console.error('Clear request failed:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error clearing students:', error);
        } finally {
            setClearing(false);
        }
    };

    const getRiskColor = (level) => {
        switch (level) {
            case 'Low': return '#10b981';
            case 'Medium': return '#f59e0b';
            case 'High': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getMetricColor = (value) => {
        if (value >= 80) return '#10b981';
        if (value >= 60) return '#f59e0b';
        return '#ef4444';
    };

    if (loading) {
        return (
            <div className="student-analytics">
                <div className="loading-state">Loading student analytics...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="student-analytics">
                <div className="error-state">
                    <h3>Error: {error}</h3>
                    <button onClick={() => window.location.reload()} className="retry-button">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="student-analytics">
            {/* Header Section */}
            <div className="analytics-header">
                <h1 className="page-title">Student Analytics Dashboard</h1>
                {students.length > 0 && (
                    <button 
                        onClick={clearStudents} 
                        disabled={clearing}
                        className="clear-button"
                    >
                        {clearing ? 'Clearing...' : `Clear All (${students.length})`}
                    </button>
                )}
            </div>

            {/* Summary Section */}
            {summary && (
                <section className="analytics-summary">
                    <h2 className="section-title">Overview</h2>
                    
                    <div className="summary-grid">
                        <div className="summary-card primary">
                            <div className="card-content">
                                <h3>Total Students</h3>
                                <span className="summary-value">{summary.totalStudents}</span>
                            </div>
                        </div>
                        
                        <div className="summary-card danger">
                            <div className="card-content">
                                <h3>At Risk</h3>
                                <span className="summary-value at-risk">{summary.atRiskCount}</span>
                            </div>
                        </div>
                        
                        <div className="summary-card info">
                            <div className="card-content">
                                <h3>Class Performance</h3>
                                <div className="averages">
                                    <div className="average-item">
                                        <span>Attendance:</span>
                                        <span style={{ color: getMetricColor(summary.averages.attendance) }}>
                                            {summary.averages.attendance}%
                                        </span>
                                    </div>
                                    <div className="average-item">
                                        <span>Marks:</span>
                                        <span style={{ color: getMetricColor(summary.averages.marks) }}>
                                            {summary.averages.marks}%
                                        </span>
                                    </div>
                                    <div className="average-item">
                                        <span>Engagement:</span>
                                        <span style={{ color: getMetricColor(summary.averages.engagement) }}>
                                            {summary.averages.engagement}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Risk Distribution */}
                    <div className="risk-distribution">
                        <h3>Risk Level Distribution</h3>
                        <div className="risk-bars">
                            {Object.entries(summary.riskDistribution).map(([level, count]) => (
                                <div key={level} className="risk-bar">
                                    <div className="risk-label">
                                        {level}
                                    </div>
                                    <div className="risk-progress">
                                        <div 
                                            className="risk-fill"
                                            style={{ 
                                                width: `${summary.totalStudents > 0 ? (count / summary.totalStudents) * 100 : 0}%`,
                                                backgroundColor: getRiskColor(level)
                                            }}
                                        />
                                    </div>
                                    <span className="risk-count">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Students List */}
            <section className="students-section">
                <h2 className="section-title">Student Details</h2>
                {students.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">Student</div>
                        <h3>No Students Found</h3>
                        <p>Generate students to see their analytics and risk analysis.</p>
                    </div>
                ) : (
                    <div className="students-grid">
                        {students.map((student) => (
                            <div key={student.student_id} className="student-card">
                                <div className="student-header">
                                    <div className="student-info">
                                        <h3 className="student-name">{student.name}</h3>
                                        <div className="student-meta">
                                            <span className="student-id">{student.student_id}</span>
                                            <span className="student-class">{student.stream} - {student.section}</span>
                                        </div>
                                    </div>
                                    <span className={`risk-badge ${student.aiInsights?.riskLevel?.toLowerCase()}`}>
                                        {student.aiInsights?.riskLevel || 'Unknown'}
                                    </span>
                                </div>
                                
                                <div className="student-metrics">
                                    <div className="metric">
                                        <span className="metric-label">Attendance</span>
                                        <span className="metric-value" style={{ color: getMetricColor(student.attendance) }}>
                                            {student.attendance}%
                                        </span>
                                    </div>
                                    <div className="metric">
                                        <span className="metric-label">Marks</span>
                                        <span className="metric-value" style={{ color: getMetricColor(student.marks) }}>
                                            {student.marks}%
                                        </span>
                                    </div>
                                    <div className="metric">
                                        <span className="metric-label">Engagement</span>
                                        <span className="metric-value" style={{ color: getMetricColor(student.engagement) }}>
                                            {student.engagement}%
                                        </span>
                                    </div>
                                    <div className="metric">
                                        <span className="metric-label">Assignments</span>
                                        <span className="metric-value" style={{ color: getMetricColor(student.assignments) }}>
                                            {student.assignments}%
                                        </span>
                                    </div>
                                </div>
                                
                                {student.aiInsights && (
                                    <div className="student-insights">
                                        <h4>Insights</h4>
                                        <ul>
                                            {student.aiInsights.insights?.map((insight, index) => (
                                                <li key={index}>{insight}</li>
                                            ))}
                                        </ul>
                                        <div className="focus-areas">
                                            <h5>Focus Areas:</h5>
                                            <div className="focus-tags">
                                                {student.aiInsights.focusAreas?.map((area, index) => (
                                                    <span key={index} className="focus-tag">{area}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default StudentAnalytics;
