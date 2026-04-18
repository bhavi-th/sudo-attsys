import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getStudentData, updateAttendance } from '../../utils/attendanceUtils';
import StudentAssignments from '../../components/StudentAssignments';
import '../../styles/student/StudentDashboard.css';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load student data from API or localStorage on component mount
    useEffect(() => {
        const loadStudentData = async () => {
            try {
                // First check if we have fake student data in localStorage
                const fakeData = getStudentData();
                
                if (fakeData) {
                    console.log('Loaded fake student data:', fakeData);
                    setStudentData(fakeData);
                    setLoading(false);
                    return;
                }
                
                // If no fake data, try to fetch real student data using authenticated user
                if (user && user.role === 'student') {
                    const API_BASE_URL = import.meta.env.VITE_PORT
                        ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
                        : import.meta.env.VITE_URL;
                    
                    const response = await fetch(`${API_BASE_URL}/api/profile/${user.id}`, {
                        headers: {
                            'Authorization': `Bearer ${user.token}`
                        }
                    });
                    
                    if (response.ok) {
                        const profileData = await response.json();
                        console.log('Loaded real student data:', profileData);
                        
                        // Transform profile data to match dashboard format
                        const transformedData = {
                            student_id: profileData.usn || profileData._id,
                            name: profileData.name || 'Student',
                            attendance: 75, // Default values - you can enhance this
                            marks: 70,
                            engagement: 65,
                            assignments: 80,
                            branch: profileData.branch,
                            semester: profileData.semester,
                            section: profileData.section
                        };
                        
                        setStudentData(transformedData);
                        setLoading(false);
                        return;
                    }
                }
                
                // If no data found, redirect to appropriate login
                setError('No student data found. Please login first.');
                setTimeout(() => navigate('/student/login'), 2000);
                
            } catch (err) {
                console.error('Failed to load student data:', err);
                setError('Failed to load student data');
                setLoading(false);
            }
        };

        loadStudentData();
    }, [navigate, user]);

    // Listen for student data updates
    useEffect(() => {
        const handleDataUpdate = (event) => {
            setStudentData(event.detail.student);
        };

        window.addEventListener('studentDataUpdated', handleDataUpdate);
        
        return () => {
            window.removeEventListener('studentDataUpdated', handleDataUpdate);
        };
    }, []);

    // Calculate risk level based on metrics
    const calculateRiskLevel = (metrics) => {
        const average = (metrics.attendance + metrics.marks + metrics.engagement + metrics.assignments) / 4;
        if (average >= 80) return { level: 'Low', color: '#10b981' };
        if (average >= 60) return { level: 'Medium', color: '#f59e0b' };
        return { level: 'High', color: '#ef4444' };
    };

    // Get progress bar color based on value
    const getProgressColor = (value) => {
        if (value >= 80) return '#10b981';
        if (value >= 60) return '#f59e0b';
        return '#ef4444';
    };

    // Use AI insights if available, fallback to basic insights
    const getInsights = (data) => {
        if (data.aiInsights && data.aiInsights.insights) {
            return data.aiInsights.insights.map(insight => ({
                type: data.aiInsights.riskLevel === 'High' ? 'danger' : 
                      data.aiInsights.riskLevel === 'Medium' ? 'warning' : 'success',
                message: insight
            }));
        }
        
        // Fallback insights
        const insights = [];
        if (data.attendance < 70) {
            insights.push({ type: 'warning', message: 'Low attendance - Regular class participation needed' });
        }
        if (data.marks < 60) {
            insights.push({ type: 'danger', message: 'Low academic performance - Consider additional study time' });
        }
        if (data.assignments < 60) {
            insights.push({ type: 'warning', message: 'Incomplete assignments - Focus on meeting deadlines' });
        }
        if (data.engagement < 50) {
            insights.push({ type: 'info', message: 'Low engagement - Increase participation in class activities' });
        }
        
        if (insights.length === 0) {
            insights.push({ type: 'success', message: 'Great performance! Keep up the excellent work' });
        }
        
        return insights;
    };

    if (loading) {
        return (
            <div className="student-dashboard">
                <div className="dashboard-container">
                    <div className="loading-state">Loading student data...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="student-dashboard">
                <div className="dashboard-container">
                    <div className="error-state">
                        <h3>Error: {error}</h3>
                        <button onClick={() => navigate('/student/login')} className="retry-button">
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const riskLevel = studentData.aiInsights?.riskLevel ? 
        { 
            level: studentData.aiInsights.riskLevel, 
            color: studentData.aiInsights.riskLevel === 'Low' ? '#10b981' :
                  studentData.aiInsights.riskLevel === 'Medium' ? '#f59e0b' : '#ef4444' 
        } : 
        calculateRiskLevel(studentData);
    const insights = getInsights(studentData);

    return (
        <div className="student-dashboard">
            <div className="dashboard-container">
                {/* Header with Student Info */}
                <header className="dashboard-header">
                    <div className="student-info">
                        <h1 className="student-name">{studentData.name}</h1>
                        <p className="student-id">ID: {studentData.student_id}</p>
                        {studentData.archetype && (
                            <p className="student-archetype">Type: {studentData.archetype.replace('_', ' ')}</p>
                        )}
                        {studentData.characteristics && (
                            <p className="student-characteristics">{studentData.characteristics}</p>
                        )}
                        {studentData.aiInsights && (
                            <p className="student-ai-insights">AI Insights: {studentData.aiInsights.insights.join(', ')}</p>
                        )}
                    </div>
                    <div className="risk-badge" style={{ backgroundColor: riskLevel.color }}>
                        {riskLevel.level} Risk
                        {studentData.aiInsights && (
                            <span className="ai-badge">AI</span>
                        )}
                    </div>
                </header>

                {/* Overview Section */}
                <section className="overview-section">
                    <h2 className="section-title">Performance Overview</h2>
                    
                    <div className="metrics-grid">
                        <div className="metric-card">
                            <div className="metric-header">
                                <span className="metric-label">Attendance</span>
                                <span className="metric-value">{studentData.attendance}%</span>
                            </div>
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill"
                                    style={{ 
                                        width: `${studentData.attendance}%`,
                                        backgroundColor: getProgressColor(studentData.attendance)
                                    }}
                                />
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-header">
                                <span className="metric-label">Marks</span>
                                <span className="metric-value">{studentData.marks}%</span>
                            </div>
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill"
                                    style={{ 
                                        width: `${studentData.marks}%`,
                                        backgroundColor: getProgressColor(studentData.marks)
                                    }}
                                />
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-header">
                                <span className="metric-label">Engagement</span>
                                <span className="metric-value">{studentData.engagement}%</span>
                            </div>
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill"
                                    style={{ 
                                        width: `${studentData.engagement}%`,
                                        backgroundColor: getProgressColor(studentData.engagement)
                                    }}
                                />
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-header">
                                <span className="metric-label">Assignments</span>
                                <span className="metric-value">{studentData.assignments}%</span>
                            </div>
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill"
                                    style={{ 
                                        width: `${studentData.assignments}%`,
                                        backgroundColor: getProgressColor(studentData.assignments)
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Insights Panel */}
                <section className="insights-section">
                    <h2 className="section-title">Insights & Recommendations</h2>
                    <div className="insights-list">
                        {insights.map((insight, index) => (
                            <div 
                                key={index} 
                                className={`insight-item insight-${insight.type}`}
                            >
                                <span className="insight-icon">
                                    {insight.type === 'success' && '✓'}
                                    {insight.type === 'warning' && '⚠'}
                                    {insight.type === 'danger' && '✕'}
                                    {insight.type === 'info' && 'ℹ'}
                                </span>
                                <span className="insight-message">{insight.message}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Assignments Section */}
                <StudentAssignments studentData={studentData} />

                {/* Quick Actions */}
                <section className="actions-section">
                    <h2 className="section-title">Quick Actions</h2>
                    <div className="actions-grid">
                        <button 
                            className="action-button"
                            onClick={() => navigate('/qrscanner')}
                        >
                            <span className="action-icon">📷</span>
                            Scan QR Code
                        </button>
                        <button 
                            className="action-button"
                            onClick={() => navigate('/login/student')}
                        >
                            <span className="action-icon">🔄</span>
                            Switch Student
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default StudentDashboard;
