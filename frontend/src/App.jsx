import './App.css';
import { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUp from './pages/SignUp';
import OnBoarding from './pages/OnBoarding';

const App = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const publicPaths = [
            '/',
            '/login/student',
            '/login/teacher',
            '/signup/student',
            '/signup/teacher',
        ];

    }, []);

    return (
        <>
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
            </Routes>
        </>
    );
};

export default App;
