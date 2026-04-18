import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [selectedStream, setSelectedStream] = useState('CSE');
    const [selectedSection, setSelectedSection] = useState('A');
    const [selectedArchetype, setSelectedArchetype] = useState('');

    const generateStudentData = async () => {
        try {
            const API_BASE_URL = import.meta.env.VITE_PORT
                ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
                : import.meta.env.VITE_URL;

            // Use a consistent session ID so fake students appear in teacher dashboard
            const studentSessionId = 'fake-students-demo';
            
            const response = await fetch(`${API_BASE_URL}/api/student/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ teacherSession: studentSessionId, stream: selectedStream, section: selectedSection, studentType: selectedArchetype || undefined })
            });

            if (!response.ok) {
                throw new Error('Failed to generate student data');
            }

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('API generation failed:', error);
            // Fallback to simple generation
            return generateFallbackData();
        }
    };

    const generateFallbackData = () => {
        const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sage', 'River'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez'];
        
        const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        return {
            student_id: 'STU' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            name: `${randomFirstName} ${randomLastName}`,
            attendance: Math.floor(Math.random() * 51) + 50,
            marks: Math.floor(Math.random() * 61) + 40,
            engagement: Math.floor(Math.random() * 71) + 30,
            assignments: Math.floor(Math.random() * 61) + 40
        };
    };

    const handleLogin = async () => {
        setLoading(true);
        
        try {
            const studentData = await generateStudentData();
            
            console.log('Generated student data:', studentData); // Debug log
            
            localStorage.setItem('studentData', JSON.stringify(studentData));
            
            // Navigate to student dashboard using the correct route
            navigate(`/dash/student/${studentData.student_id}`);
        } catch (error) {
            console.error('Failed to store student data:', error);
            alert('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1 className="login-title">Student Login</h1>
                    <p className="login-subtitle">AttSys 2.0 - Student Portal</p>
                </div>
                
                <div className="login-content">
                    <p className="login-description">
                        Choose your academic details:
                    </p>
                    
                    <div className="academic-selection">
                        <div className="selection-group">
                            <label htmlFor="stream">Stream:</label>
                            <select 
                                id="stream"
                                value={selectedStream} 
                                onChange={(e) => setSelectedStream(e.target.value)}
                                disabled={loading}
                                className="selection-dropdown"
                            >
                                <option value="CSE">Computer Science</option>
                                <option value="ECE">Electronics & Communication</option>
                                <option value="ME">Mechanical Engineering</option>
                                <option value="CE">Civil Engineering</option>
                                <option value="EEE">Electrical & Electronics</option>
                                <option value="IT">Information Technology</option>
                            </select>
                        </div>
                        
                        <div className="selection-group">
                            <label htmlFor="section">Section:</label>
                            <select 
                                id="section"
                                value={selectedSection} 
                                onChange={(e) => setSelectedSection(e.target.value)}
                                disabled={loading}
                                className="selection-dropdown"
                            >
                                <option value="A">Section A</option>
                                <option value="B">Section B</option>
                                <option value="C">Section C</option>
                                <option value="D">Section D</option>
                            </select>
                        </div>
                        
                        <div className="selection-group">
                            <label htmlFor="archetype">Student Type (Risk Level):</label>
                            <select 
                                id="archetype"
                                value={selectedArchetype} 
                                onChange={(e) => setSelectedArchetype(e.target.value)}
                                disabled={loading}
                                className="selection-dropdown"
                            >
                                <option value="">Random Selection</option>
                                <option value="high_achiever">High Achiever (Low Risk)</option>
                                <option value="average_student">Average Student (Medium Risk)</option>
                                <option value="struggling_student">Struggling Student (High Risk)</option>
                                <option value="engaged_but_struggling">Engaged but Struggling (Medium-High Risk)</option>
                                <option value="disengaged_high_potential">Disengaged High Potential (Medium Risk)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="login-options">
                        <button 
                            className="login-button"
                            onClick={handleLogin}
                            disabled={loading}
                        >
                            {loading ? 'Creating Profile...' : 'Generate Student Profile'}
                        </button>
                    </div>
                    
                    <p className="login-note">
                        Your profile will be generated based on the selected student type with realistic academic patterns.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
