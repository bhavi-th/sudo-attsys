import '../styles/OnBoarding.css';
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const OnBoarding = ({ type }) => {
    const location = useLocation();
    const [name, setName] = useState('');
    const [branch, setBranch] = useState(() => {
        if (type === 'student' && location.state?.branch) {
            return location.state.branch;
        }
        return 'CS';
    });
    const [usn, setUsn] = useState('');
    const [subjectCount, setSubjectCount] = useState('');
    const [courseLoads, setCourseLoads] = useState([{ subject: '', sections: '', semester: '' }]);

    const [studentSection, setStudentSection] = useState('');
    const [isLoading, setIsLoading] = useState('');

    const navigate = useNavigate();
    const { user, setUser } = useAuth();


    return (
        <div className="Form">
            <Link className="logo" to="/">
                ATTSYS2-0
            </Link>
            <div className="greetings">
                <h1>Welcome on Board</h1>
                <p>To get started, Please fill in your personal information.</p>
            </div>

            <form name="form" className="form personal-info" onSubmit={handleSubmit}>
                <h1>Personal Info</h1>
                <div className="input-holder input-holder-info">
                    <input
                        placeholder="Full Name"
                        type="text"
                        required
                        disabled={isLoading}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <select
                        className="form-select"
                        required
                        disabled={isLoading}
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                    >
                        <option value="CS">Computer Science</option>
                        <option value="EC">Electronics & Communication</option>
                        <option value="ME">Mechanical Engineering</option>
                        <option value="CE">Civil Engineering</option>
                        <option value="IS">Information Science</option>
                        <option value="AI">Artificial Intelligence</option>
                    </select>

                    {type === 'student' ? (
                        <>
                            <input
                                placeholder="USN"
                                type="text"
                                required
                                disabled={isLoading}
                                value={usn}
                                onChange={(e) => setUsn(e.target.value)}
                            />
                            <input
                                placeholder="Section"
                                type="number"
                                required
                                disabled={isLoading}
                                value={studentSection}
                                onChange={(e) => setStudentSection(e.target.value)}
                            />
                        </>
                    ) : (
                        <>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                placeholder="How many subjects are you handling (e.g. 2)"
                                disabled={isLoading}
                                value={subjectCount}
                                onChange={handleSubjectCountChange}
                            />

                            <div className="dynamic-inputs">
                                {courseLoads.map((course, index) => (
                                    <div key={index} className="course-row">
                                        <input
                                            className="subjects"
                                            placeholder={`Subject ${index + 1}`}
                                            required
                                            disabled={isLoading}
                                            value={course.subject}
                                            onChange={(e) =>
                                                handleCourseChange(index, 'subject', e.target.value)
                                            }
                                            key={index + '1'}
                                        />
                                        <input
                                            className="sections"
                                            placeholder="Sections (e.g. A B)"
                                            required
                                            disabled={isLoading}
                                            value={course.sections}
                                            onChange={(e) =>
                                                handleCourseChange(
                                                    index,
                                                    'sections',
                                                    e.target.value,
                                                )
                                            }
                                            key={index + '2'}
                                        />
                                        <input
                                            className="semesters"
                                            placeholder="Semester (e.g. 4)"
                                            required
                                            disabled={isLoading}
                                            value={course.semester}
                                            onChange={(e) =>
                                                handleCourseChange(
                                                    index,
                                                    'semester',
                                                    e.target.value,
                                                )
                                            }
                                            key={index + '3'}
                                        />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="form-controls">
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        disabled={isLoading}
                    >
                        Clear
                    </button>
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default OnBoarding;
