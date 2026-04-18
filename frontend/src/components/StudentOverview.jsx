import React, { useState, useEffect } from 'react';

const StudentOverview = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Helper function to fetch student data
    const fetchStudentData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('http://localhost:5000/api/student/123');
            
            if (!response.ok) {
                throw new Error('Failed to fetch student data');
            }
            
            const studentData = await response.json();
            setData(studentData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudentData();
    }, []);

    // Calculate risk level based on metrics
    const calculateRiskLevel = (metrics) => {
        const average = (metrics.attendance + metrics.marks + metrics.engagement + metrics.assignments) / 4;
        if (average >= 80) return 'Low';
        if (average >= 60) return 'Medium';
        return 'High';
    };

    const riskLevel = data ? calculateRiskLevel(data) : 'Medium';

    const getRiskColor = (level) => {
        switch (level) {
            case 'Low': return '#10b981';
            case 'Medium': return '#f59e0b';
            case 'High': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getProgressColor = (value) => {
        if (value >= 80) return '#10b981';
        if (value >= 60) return '#f59e0b';
        return '#ef4444';
    };

    if (loading) {
        return (
            <div className="student-overview">
                <div className="overview-card">
                    <div className="loading-state">Loading...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="student-overview">
                <div className="overview-card">
                    <div className="error-state">Error: {error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="student-overview">
            <div className="overview-card">
                <div className="card-header">
                    <h3 className="card-title">
                        <span className="title-icon">Student Overview</span>
                    </h3>
                </div>
                
                <div className="metrics-grid">
                    <div className="metric-item">
                        <div className="metric-header">
                            <span className="metric-label">Attendance</span>
                            <span className="metric-value">{data.attendance}%</span>
                        </div>
                        <div className="progress-bar">
                            <div 
                                className="progress-fill"
                                style={{ 
                                    width: `${data.attendance}%`,
                                    backgroundColor: getProgressColor(data.attendance)
                                }}
                            />
                        </div>
                    </div>

                    <div className="metric-item">
                        <div className="metric-header">
                            <span className="metric-label">Marks</span>
                            <span className="metric-value">{data.marks}%</span>
                        </div>
                        <div className="progress-bar">
                            <div 
                                className="progress-fill"
                                style={{ 
                                    width: `${data.marks}%`,
                                    backgroundColor: getProgressColor(data.marks)
                                }}
                            />
                        </div>
                    </div>

                    <div className="metric-item">
                        <div className="metric-header">
                            <span className="metric-label">Engagement</span>
                            <span className="metric-value">{data.engagement}%</span>
                        </div>
                        <div className="progress-bar">
                            <div 
                                className="progress-fill"
                                style={{ 
                                    width: `${data.engagement}%`,
                                    backgroundColor: getProgressColor(data.engagement)
                                }}
                            />
                        </div>
                    </div>

                    <div className="metric-item">
                        <div className="metric-header">
                            <span className="metric-label">Assignments</span>
                            <span className="metric-value">{data.assignments}%</span>
                        </div>
                        <div className="progress-bar">
                            <div 
                                className="progress-fill"
                                style={{ 
                                    width: `${data.assignments}%`,
                                    backgroundColor: getProgressColor(data.assignments)
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="risk-section">
                    <div className="risk-header">
                        <span className="risk-label">Risk Level</span>
                        <span 
                            className="risk-value"
                            style={{ color: getRiskColor(riskLevel) }}
                        >
                            {riskLevel}
                        </span>
                    </div>
                    <div className="risk-indicator">
                        <div 
                            className="risk-dot"
                            style={{ backgroundColor: getRiskColor(riskLevel) }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentOverview;
