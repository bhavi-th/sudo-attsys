import '../styles/LandingPage.css';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    return (
        <div className="LandingPage">
            <h1>ATTSYS2-0</h1>
            <div className="landing-actions">
                <Link className="landing-link" to="/login/teacher">
                    Teacher
                </Link>
                <Link className="landing-link" to="/login/student">
                    Student
                </Link>
            </div>
        </div>
    );
};

export default LandingPage;
