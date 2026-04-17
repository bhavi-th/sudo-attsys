import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Form.css';

const Form = ({ formType, type }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [academicYear, setAcademicYear] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();


    return (
        <div className="Form">
            <form className="form" name="form">
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
