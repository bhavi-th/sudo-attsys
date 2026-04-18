import './App.css';
import { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import NavBar from './components/NavBar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUp from './pages/SignUp';
import QRScanner from './pages/student/QRScanner';
import ProtectedRoute from './components/ProtectedRoute';
import OnBoarding from './pages/OnBoarding';
import TeacherDash from './pages/teacher/TeacherDash';
import AttendancePage from './pages/teacher/AttendancePage';
import AttendanceHistory from './pages/teacher/AttendanceHistory';
import StudentDash from './pages/student/StudentDash';
import { Toaster } from 'react-hot-toast';
import CreateAssignment from './pages/teacher/CreateAssignment';
import AssignmentDashboard from './pages/teacher/AssignmentDashboard';
import EditAssignment from './pages/teacher/EditAssignment';

const App = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    useEffect(() => {
        const publicPaths = [
            '/login/student',
            '/login/teacher',
            '/signup/student',
            '/signup/teacher',
            '/assignment'
        ];

        if (user?.token && user?.isOnboarded && publicPaths.includes(location.pathname)) {
            navigate(`/dash/${user.role}/${user.id}`);
        }
    }, [user, navigate, location.pathname]);

    return (
        <>
            <Toaster position="top-center" reverseOrder={false} />
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login/student" element={<LoginPage type="student" />} />
                <Route path="/login/teacher" element={<LoginPage type="teacher" />} />
                <Route path="/signup/student" element={<SignUp type="student" />} />
                <Route path="/signup/teacher" element={<SignUp type="teacher" />} />
                <Route
                    path="/onboard/teacher"
                    element={<OnBoarding formType="login" type="teacher" />}
                />
                <Route
                    path="/onboard/student"
                    element={<OnBoarding formType="login" type="student" />}
                />
                <Route
                    path="/dash/teacher/:id"
                    element={
                        <ProtectedRoute>
                            <NavBar />
                            <TeacherDash />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/attendance/:branch/:subject/:sectionName/:semester"
                    element={
                        <ProtectedRoute>
                            <NavBar />
                            <AttendancePage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dash/student/:id"
                    element={
                        <ProtectedRoute>
                            <NavBar />
                            <StudentDash />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/qrscanner"
                    element={
                        <ProtectedRoute>
                            <QRScanner />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dash/teacher/:id/create-assignment"
                    element={
                        <ProtectedRoute>
                            <NavBar />
                            <CreateAssignment />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dash/teacher/:id/attendance-history"
                    element={
                        <ProtectedRoute>
                            <NavBar />
                            <AttendanceHistory />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dash/teacher/:id/assignments"
                    element={
                        <ProtectedRoute>
                            <NavBar />
                            <AssignmentDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dash/teacher/:id/edit-assignment/:assignmentId"
                    element={
                        <ProtectedRoute>
                            <NavBar />
                            <EditAssignment />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dash/teacher/:id/assignment/:assignmentId"
                    element={
                        <ProtectedRoute>
                            <NavBar />
                            <AssignmentDashboard />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </>
    );
};

export default App;

