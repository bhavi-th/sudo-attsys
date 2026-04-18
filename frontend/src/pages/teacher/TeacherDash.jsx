import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import CreateAssignment from './CreateAssignment';
import RiskAnalysis from "../../components/RiskAnalysis";
import '../../styles/teacher/TeacherDash.css';

const TeacherDash = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [courses, setCourses] = useState([]);
    const [branch, setBranch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
                } else {
                    console.error('Profile fetch error:', data.error);
                }
            } catch (error) {
                console.error('Connection error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [id]);

    if (loading) {
        return <div className="TeacherDash">Loading Dashboard...</div>;
    }

    return (
        <div className="TeacherDash">
            <div className="dashboard-container">

                <span className="dash-section">ATTENDANCE</span>

                <div className="subjects">
                    {courses.length > 0 ? (
                        courses.map((course, courseIndex) => (
                            <div className="subject" key={courseIndex}>
                                <h2 className="subject-title">
                                    {course.subject}
                                </h2>

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
                                            >
                                                Section {sec}
                                            </button>
                                        ))
                                    ) : (
                                        <p className="muted-text">
                                            No sections assigned
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-data">
                            <p>
                                No subjects found. Please complete onboarding.
                            </p>
                        </div>
                    )}
                </div>

                <span className="dash-section">Assignment</span>

                <Link to={`/dash/teacher/${id}/assignments`}>
                    <button type="button" className="attendance-btn">
                        Manage Assignments
                    </button>
                </Link>

                <Link to={`/dash/teacher/${id}/create-assignment`}>
                    <button type="button" className="attendance-btn">
                        Create Assignment
                    </button>
                </Link>

                <span className="dash-section">Attendance history</span>
                <Link to={`/dash/teacher/${id}/attendance-history`}>
                    <button type="button" className="attendance-btn">
                        View Attendance History
                    </button>
                </Link>

                <span className="dash-section">Risk Analysis</span>
                <RiskAnalysis studentId={id} />

            </div>
        </div>
    );
};

export default TeacherDash;

