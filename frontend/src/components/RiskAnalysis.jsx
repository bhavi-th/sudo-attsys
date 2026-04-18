import { useState } from 'react';
import '../styles/teacher/RiskAnalysis.css';

const RiskAnalysis = ({ studentId }) => {
    const [riskData, setRiskData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form state for manual input
    const [formData, setFormData] = useState({
        attendance_percentage: '',
        avg_marks: '',
        assignment_completion: '',
        engagement_score: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // Only allow numbers between 0-100
        if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handlePredict = async () => {
        // Validate all fields are filled
        if (!formData.attendance_percentage || !formData.avg_marks || 
            !formData.assignment_completion || !formData.engagement_score) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const API_BASE_URL = import.meta.env.VITE_PORT
                ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
                : import.meta.env.VITE_URL;

            const response = await fetch(`${API_BASE_URL}/api/risk/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    attendance_percentage: parseFloat(formData.attendance_percentage),
                    avg_marks: parseFloat(formData.avg_marks),
                    assignment_completion: parseFloat(formData.assignment_completion),
                    engagement_score: parseFloat(formData.engagement_score)
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setRiskData(data);
            } else {
                setError(data.error || 'Failed to fetch risk analysis');
            }
        } catch (error) {
            setError('Connection error fetching risk analysis');
        } finally {
            setLoading(false);
        }
    };

    const getRiskLevelColor = (level) => {
        switch (level) {
            case 'LOW':
                return '#00ff88';
            case 'MEDIUM':
                return '#ffaa00';
            case 'HIGH':
                return '#ff4444';
            default:
                return '#00fff2';
        }
    };

    const getRiskScoreColor = (score) => {
        if (score < 0.30) return '#00ff88';  // LOW (<30%) -> green
        if (score < 0.70) return '#ffaa00';  // MEDIUM (30-70%) -> yellow  
        return '#ff4444';                    // HIGH (>70%) -> red
    };

    // REMOVED: GetRiskLevelPercentage function - using continuous scoring now

    return (
        <div className="risk-analysis">
            <div className="risk-header">
                <h3 className="risk-title">Student Risk Analysis</h3>
            </div>
            
            {/* Input Form */}
            <div className="risk-input-section">
                <div className="risk-label">Enter Student Attributes</div>
                <div className="risk-input-grid">
                    <div className="risk-input-group">
                        <label>Attendance (%)</label>
                        <input
                            type="number"
                            name="attendance_percentage"
                            value={formData.attendance_percentage}
                            onChange={handleInputChange}
                            min="0"
                            max="100"
                            placeholder="0-100"
                            className="risk-input"
                        />
                    </div>
                    <div className="risk-input-group">
                        <label>Marks (%)</label>
                        <input
                            type="number"
                            name="avg_marks"
                            value={formData.avg_marks}
                            onChange={handleInputChange}
                            min="0"
                            max="100"
                            placeholder="0-100"
                            className="risk-input"
                        />
                    </div>
                    <div className="risk-input-group">
                        <label>Assignment (%)</label>
                        <input
                            type="number"
                            name="assignment_completion"
                            value={formData.assignment_completion}
                            onChange={handleInputChange}
                            min="0"
                            max="100"
                            placeholder="0-100"
                            className="risk-input"
                        />
                    </div>
                    <div className="risk-input-group">
                        <label>Engagement (%)</label>
                        <input
                            type="number"
                            name="engagement_score"
                            value={formData.engagement_score}
                            onChange={handleInputChange}
                            min="0"
                            max="100"
                            placeholder="0-100"
                            className="risk-input"
                        />
                    </div>
                </div>
                <button 
                    onClick={handlePredict}
                    disabled={loading}
                    className="risk-predict-btn"
                >
                    {loading ? 'Analyzing...' : 'Predict Risk'}
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="risk-analysis-error">{error}</div>
            )}

            {/* Results Display */}
            {riskData && (
                <div className="risk-content">
                    <div className="risk-level-section">
                        <div className="risk-label">Risk Level</div>
                        <div 
                            className="risk-level-badge"
                            style={{ backgroundColor: getRiskLevelColor(riskData.risk_level) }}
                        >
                            {riskData.risk_level}
                        </div>
                    </div>

                    <div className="risk-score-section">
                        <div className="risk-label">Risk Score</div>
                        <div className="risk-score-container">
                            <div className="risk-score-bar">
                                <div 
                                    className="risk-score-fill"
                                    style={{ 
                                        width: `${(riskData.risk_score * 100).toFixed(1)}%`,
                                        backgroundColor: getRiskScoreColor(riskData.risk_score)
                                    }}
                                />
                            </div>
                            <div className="risk-score-value">
                                {(riskData.risk_score * 100).toFixed(1)}%
                            </div>
                        </div>
                    </div>

                    <div className="risk-reasons-section">
                        <div className="risk-label">Key Factors</div>
                        <ul className="risk-reasons-list">
                            {riskData.reasons.map((reason, index) => (
                                <li key={index} className="risk-reason-item">
                                    {reason}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RiskAnalysis;
