import '../styles/OnBoarding.css';
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import toast from 'react-hot-toast';

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

    const handleSubjectCountChange = (e) => {
        const newCount = Math.max(1, parseInt(e.target.value) || 1);
        setSubjectCount(newCount);

        setCourseLoads((prev) => {
            if (newCount > prev.length) {
                const extraRows = Array.from({ length: newCount - prev.length }, () => ({
                    subject: '',
                    sections: '',
                    semester: '',
                }));
                return [...prev, ...extraRows];
            } else {
                return prev.slice(0, newCount);
            }
        });
    };

    const handleCourseChange = (index, field, value) => {
        setCourseLoads((prev) =>
            prev.map((course, i) => (i === index ? { ...course, [field]: value } : course)),
        );
    };

    async function handleSubmit(e) {
        e.preventDefault();
        setIsLoading(true);

        const isValidSection = (num) => {
            return !isNaN(num) && num > 0 && num <= 20 && !undefined;
        };

        if (type === 'student') {
            if (!isValidSection(studentSection)) {
                return toast.error('Section must be a number between 1 and 20');
            }
        } else {
            for (let i = 0; i < courseLoads.length; i++) {
                const sectionArray = courseLoads[i].sections.trim().split(/\s+/);

                const allValid =
                    sectionArray.length > 0 && sectionArray.every((sec) => isValidSection(sec));

                if (!allValid) {
                    return toast.error(
                        `Subject ${i + 1} has invalid sections. Please enter numbers between 1 and 20 (e.g., 1 5 12).`,
                    );
                }
            }
        }

        const idToUpdate = user?.id || localStorage.getItem('onboardingUserId');
        const token = user?.token;

        if (!idToUpdate) {
            toast.error('Session error. Please try signing up again.');
            return;
        }

        const payload = {
            name,
            branch,
            ...(type === 'student'
                ? { usn, section: studentSection }
                : {
                      courses: courseLoads.map((c) => ({
                          subject: c.subject,
                          sections: c.sections
                              .trim()
                              .split(/\s+/)
                              .map((sec) => parseInt(sec, 10)),
                          semester: Number(c.semester),
                      })),
                  }),
        };

        try {
            const API_BASE_URL = import.meta.env.VITE_PORT
                ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
                : import.meta.env.VITE_URL;
            const response = await fetch(`${API_BASE_URL}/api/onboarding/${idToUpdate}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.removeItem('onboardingUserId');
                localStorage.setItem('isOnboarded', 'true');
                if (user) {
                    localStorage.setItem('isOnboarded', 'true');
                    setUser({ ...user, isOnboarded: true });
                    navigate(`/dash/${type}/${user.id}`);
                } else {
                    toast.success('Profile Setup Complete! Please Login.');
                    navigate(`/login/${type}`);
                }
            } else {
                toast.error(data.error || 'Update failed');
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Connection error:', err);
            toast.error('Connection lost. Please try again.');
            setIsLoading(false);
        }
    }

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
