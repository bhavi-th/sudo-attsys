import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/Form.css';
import toast from 'react-hot-toast';

const Form = ({ formType, type }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [academicYear, setAcademicYear] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    const calculateStudentDetails = (emailString) => {
        const bmsitRegex = /^(\d{2})ug1by([a-z]{2})\d{3}@bmsit\.in$/i;
        const match = emailString.match(bmsitRegex);

        if (match) {
            const admissionYearShort = parseInt(match[1]);
            const branchCode = match[2].toUpperCase();

            const now = new Date();
            const currentYearShort = now.getFullYear() % 100;
            const currentMonth = now.getMonth();

            let year = currentYearShort - admissionYearShort;
            if (currentMonth >= 7) year += 1;
            year = Math.max(1, year);

            let semester = year * 2 - 1;
            if (currentMonth > 2 && currentMonth < 7) {
                semester = year * 2;
            }

            return {
                year: year,
                semester: semester,
                branch: branchCode,
            };
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.value = 'Loading...';

        const details = type === 'student' ? calculateStudentDetails(email) : null;

        if (type === 'student' && !details && !academicYear) {
            return toast.error('Please use your college email id');
        } else if (type === 'teacher') {
            if (!email.endsWith('@bmsit.in')) {
                return toast.error('Teachers must use there college email id');
            }
        }

        setIsLoading(true);

        const endpoint = formType === 'Log In' ? '/login' : '/register';

        try {
            const API_BASE_URL =
                import.meta.env.VITE_PORT && import.meta.env.VITE_PORT !== 'undefined'
                    ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
                    : import.meta.env.VITE_URL;

            console.log('API Base URL:', API_BASE_URL);

            const payload = {
                email,
                password,
                role: type,
                ...(type === 'student' && { academicYear: details.year }),
                ...(type === 'student' && { semester: details.semester }),
            };

            const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                if (formType === 'Log In') {
                    login({
                        token: data.token,
                        role: data.user.role,
                        isOnboarded: data.user.isOnboarded,
                        id: data.user.id,
                    });

                    toast.success('Login Successful!');

                    if (!data.user.isOnboarded) {
                        navigate(`/onboard/${data.user.role}`, {
                            state: { branch: details?.branch },
                        });
                    } else {
                        navigate(`/dash/${type}/${data.user.id}`);
                    }
                } else {
                    localStorage.setItem('onboardingUserId', data.id);
                    toast.success("Account created! Let's set up your profile.");
                    navigate(`/onboard/${type}`, { state: { branch: details?.branch } });
                }
            } else {
                toast.error(data.error || 'Something went wrong');
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Login error:', error);
            
            // If it's a connection error, retry once
            if (error.message.includes('Failed to connect to server')) {
                toast.error('Connection failed. Retrying...');
                setTimeout(() => {
                    // Retry the login automatically
                    handleSubmit(e);
                }, 2000);
            } else {
                toast.error(error.message || 'Login failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="Form">
            <form className="form" name="form" onSubmit={handleSubmit}>
                <Link className="logo" to="/">
                    ATTSYS2-0
                </Link>
                <h1>{formType}</h1>
                <div className="input-holder">
                    <input
                        placeholder="Mail ID"
                        type="email"
                        required
                        disabled={isLoading}
                        value={email}
                        onChange={(e) => {
                            const val = e.target.value;
                            setEmail(val);
                            if (type === 'student') {
                                setAcademicYear(calculateStudentDetails(val));
                            }
                        }}
                    />
                    <input
                        placeholder="Password"
                        type="password"
                        required
                        disabled={isLoading}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div className="form-controls">
                    <button
                        type="reset"
                        disabled={isLoading}
                        onClick={() => {
                            setEmail('');
                            setPassword('');
                            setAcademicYear(null);
                        }}
                    >
                        Clear
                    </button>
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Loading...' : formType}
                    </button>
                </div>
                {formType === 'Log In' ? (
                    <p>
                        Don't have an account? Click{' '}
                        <Link to={type === 'teacher' ? '/signup/teacher' : '/signup/student'}>
                            here
                        </Link>{' '}
                        to signup
                    </p>
                ) : (
                    <p>
                        Already have an account? Click{' '}
                        <Link to={type === 'teacher' ? '/login/teacher' : '/login/student'}>
                            here
                        </Link>{' '}
                        to login
                    </p>
                )}
            </form>
        </div>
    );
};

export default Form;
