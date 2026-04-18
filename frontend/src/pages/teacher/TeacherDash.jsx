import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Toaster, toast } from 'react-hot-toast';
import CreateAssignment from './CreateAssignment';
import RiskAnalysis from "../../components/RiskAnalysis";
import StudentAnalytics from "../../components/StudentAnalytics";
import AssignmentsTab from "../../components/AssignmentsTab";
import '../../styles/teacher/TeacherDash.css';

const TeacherDash = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();

    const [courses, setCourses] = useState([]);
    const [branch, setBranch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hoveredCourse, setHoveredCourse] = useState(null);
    const [sessionId, setSessionId] = useState(null);

    useEffect(() => {
        // Initialize session when teacher logs in
        const initializeSession = async () => {
            console.log('User object:', user);
            console.log('User sessionId:', user?.sessionId);
            
            if (user?.sessionId) {
                setSessionId(user.sessionId);
                console.log('Set sessionId to:', user.sessionId);
                
                // Clear any existing students for this session
                try {
                    const API_BASE_URL = import.meta.env.VITE_PORT
                        ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
                        : import.meta.env.VITE_URL;

                    await fetch(`${API_BASE_URL}/api/analyzer/clear-session/${user.sessionId}`, {
                        method: 'DELETE'
                    });
                    console.log('Cleared previous session data');
                } catch (error) {
                    console.error('Error clearing session:', error);
                }
            }
        };

        initializeSession();
    }, [user]);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!id) {
                setError('No teacher ID provided');
                setLoading(false);
                return;
            }

            try {
                const API_BASE_URL = import.meta.env.VITE_PORT
                    ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
                    : import.meta.env.VITE_URL;

                const response = await fetch(`${API_BASE_URL}/api/profile/${id}`);
                const data = await response.json();

                if (response.ok) {
                    setCourses(data.courses || []);
                    setBranch(data.branch || '');
                    setError(null);
                } else {
                    setError(data.error || 'Failed to load profile data');
                }
            } catch (error) {
                setError('Connection error. Please check your internet connection.');
                console.error('Connection error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [id]);

    if (loading) {
        return (
            <div className="TeacherDash loading-state">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <div className="loading-text">Loading Dashboard...</div>
                </div>
            </div>
        );
    }

    const handleRetry = () => {
        setLoading(true);
        setError(null);
        // Trigger the useEffect again by changing a dependency
        const fetchUserProfile = async () => {
            if (!id) return;

            try {
                const API_BASE_URL = import.meta.env.VITE_PORT
                    ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
                    : import.meta.env.VITE_URL;

                const response = await fetch(`${API_BASE_URL}/api/profile/${id}`);
                const data = await response.json();

                if (response.ok) {
                    setCourses(data.courses || []);
                    setBranch(data.branch || '');
                    setError(null);
                } else {
                    setError(data.error || 'Failed to load profile data');
                }
            } catch (error) {
                setError('Connection error. Please check your internet connection.');
            } finally {
                setLoading(false);
            }
        };
        fetchUserProfile();
    };

    return (
        <div className="TeacherDash">
            <div className="dashboard-container">
                {/* Header Section */}
                <header className="dashboard-header">
                    <h1 className="dashboard-title">Teacher Dashboard</h1>
                    {branch && (
                        <div className="branch-info">
                            <span className="branch-label">Branch:</span>
                            <span className="branch-value">{branch}</span>
                        </div>
                    )}
                </header>

                {/* Error State */}
                {error && (
                    <div className="error-state">
                        <div className="error-icon">⚠️</div>
                        <div className="error-message">{error}</div>
                        <button onClick={handleRetry} className="retry-btn">
                            Retry
                        </button>
                    </div>
                )}

                {/* Attendance Section */}
                <section className="dashboard-section">
                    <h2 className="section-header">
                        Attendance Management
                    </h2>
                    
                    {courses.length > 0 ? (
                        <div className="subjects">
                            {courses.map((course, courseIndex) => (
                                <article 
                                    className={`subject ${hoveredCourse === courseIndex ? 'hovered' : ''}`}
                                    key={courseIndex}
                                    onMouseEnter={() => setHoveredCourse(courseIndex)}
                                    onMouseLeave={() => setHoveredCourse(null)}
                                >
                                    <div className="subject-header">
                                        <h3 className="subject-title">
                                            {course.subject}
                                        </h3>
                                        {course.semester && (
                                            <span className="semester-badge">Semester {course.semester}</span>
                                        )}
                                    </div>

                                    <div className="section-grid">
                                        {course.sections && course.sections.length > 0 ? (
                                            course.sections.map((sec, secIndex) => (
                                                <button
                                                    key={secIndex}
                                                    className="attendance-btn"
                                                    onClick={() =>
                                                        navigate(
                                                            `/attendance/${branch}/${course.subject}/${sec}/${course.semester}`
                                                        )
                                                    }
                                                    aria-label={`Take attendance for Section ${sec} in ${course.subject}`}
                                                >
                                                    Section {sec}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="no-sections">
                                                <p className="muted-text">
                                                    No sections assigned
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="no-data">
                            <p>
                                No subjects found. Please complete onboarding.
                            </p>
                            <Link to="/onboarding" className="onboarding-link">
                                Complete Onboarding
                            </Link>
                        </div>
                    )}
                </section>

                {/* Quick Actions Section */}
                <section className="dashboard-section">
                    <h2 className="section-header">
                        Quick Actions
                    </h2>
                    
                    <div className="action-grid">
                        <Link to={`/dash/teacher/${id}/assignments`} className="action-card">
                            <h3 className="action-title">Manage Assignments</h3>
                            <p className="action-description">View and manage all assignments</p>
                        </Link>

                        <Link to={`/dash/teacher/${id}/create-assignment`} className="action-card">
                            <h3 className="action-title">Create Assignment</h3>
                            <p className="action-description">Create a new assignment</p>
                        </Link>

                        <Link to={`/dash/teacher/${id}/attendance-history`} className="action-card">
                            <h3 className="action-title">Attendance History</h3>
                            <p className="action-description">View attendance records</p>
                        </Link>
                    </div>
                </section>

                {/* Assignments Section */}
                <section className="dashboard-section">
                    <h2 className="section-header">
                        Assignments Overview
                    </h2>
                    <AssignmentsTab teacherId={id} />
                </section>

                {/* Student Analytics Section */}
                <section className="dashboard-section">
                    <h2 className="section-header">
                        Student Analytics & Risk Analysis
                    </h2>
                    <StudentAnalytics sessionId={sessionId} />
                </section>
            </div>
        </div>
    );
};

export default TeacherDash;

const handleRetry = () => {
    setLoading(true);
    setError(null);
    // Trigger the useEffect again by changing a dependency
    const fetchUserProfile = async () => {
        if (!id) return;

        try {
            const API_BASE_URL = import.meta.env.VITE_PORT
                ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
                : import.meta.env.VITE_URL;

            const response = await fetch(`${API_BASE_URL}/api/profile/${id}`);
            const data = await response.json();

            if (response.ok) {
                setCourses(data.courses || []);
                setBranch(data.branch || '');
                setError(null);
            } else {
                setError(data.error || 'Failed to load profile data');
            }
        } catch (error) {
            setError('Connection error. Please check your internet connection.');
        } finally {
            setLoading(false);
        }
    };
    fetchUserProfile();
};

