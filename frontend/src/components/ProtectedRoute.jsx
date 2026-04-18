import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const ProtectedRoute = ({ children, allowedRole }) => {
    const { user } = useAuth();

    // Check for student data in localStorage for fake student login
    const getStudentData = () => {
        try {
            const studentData = localStorage.getItem('studentData');
            return studentData ? JSON.parse(studentData) : null;
        } catch (error) {
            return null;
        }
    };

    const studentData = getStudentData();
    const isStudentRoute = location.pathname.includes('/dash/student');

    // Handle student routes - allow either fake student data OR real authenticated student
    if (isStudentRoute) {
        // Allow access if fake student data exists
        if (studentData) {
            return children;
        }
        // Allow access if real authenticated student
        if (user && user.role === 'student' && user.isOnboarded) {
            return children;
        }
        // Redirect to appropriate login based on what's available
        return <Navigate to="/student/login" replace />;
    }

    // Check for authenticated user (for non-student routes)
    if (!user) return <Navigate to="/" replace />;

    if (!user.isOnboarded) {
        if (location.pathname.startsWith('/onboard')) {
            return children;
        }
        return <Navigate to={`/onboard/${user.role}`} replace />;
    }

    if (allowedRole && user.role !== allowedRole) {
        return <Navigate to="/dash" replace />;
    }

    return children;
};

export default ProtectedRoute;
