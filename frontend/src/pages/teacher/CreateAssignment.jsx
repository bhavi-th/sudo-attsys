import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import '../../styles/teacher/CreateAssignment.css';

const CreateAssignment = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const prefill = location.state || {};

    const [form, setForm] = useState({
        title: '',
        description: '',
        subject: prefill.subject || '',
        section: prefill.section || '',
        semester: prefill.semester || '',
        dueDate: ''
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched(prev => ({
            ...prev,
            [name]: true
        }));
        validateField(name, e.target.value);
    };

    const validateField = (fieldName, value) => {
        const newErrors = { ...errors };
        
        switch (fieldName) {
            case 'title':
                if (!value.trim()) {
                    newErrors.title = 'Assignment title is required';
                } else if (value.trim().length < 3) {
                    newErrors.title = 'Title must be at least 3 characters';
                } else {
                    delete newErrors.title;
                }
                break;
            case 'description':
                if (!value.trim()) {
                    newErrors.description = 'Assignment description is required';
                } else if (value.trim().length < 10) {
                    newErrors.description = 'Description must be at least 10 characters';
                } else {
                    delete newErrors.description;
                }
                break;
            case 'subject':
                if (!value.trim()) {
                    newErrors.subject = 'Subject is required';
                } else {
                    delete newErrors.subject;
                }
                break;
            case 'section':
                if (!value.trim()) {
                    newErrors.section = 'Section is required';
                } else {
                    delete newErrors.section;
                }
                break;
            case 'semester':
                if (!value.trim()) {
                    newErrors.semester = 'Semester is required';
                } else {
                    delete newErrors.semester;
                }
                break;
            case 'dueDate':
                if (!value) {
                    newErrors.dueDate = 'Due date is required';
                } else {
                    const selectedDate = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (selectedDate < today) {
                        newErrors.dueDate = 'Due date cannot be in the past';
                    } else {
                        delete newErrors.dueDate;
                    }
                }
                break;
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateForm = () => {
        const fields = ['title', 'description', 'subject', 'section', 'semester', 'dueDate'];
        let isValid = true;
        
        fields.forEach(field => {
            if (!validateField(field, form[field])) {
                isValid = false;
            }
        });
        
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all fields
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const API_BASE_URL = import.meta.env.VITE_PORT
                ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
                : import.meta.env.VITE_URL;

            console.log('Creating assignment with data:', {
                teacherId: id,
                ...form
            });
            console.log('API URL:', `${API_BASE_URL}/api/assignments/create`);

            const res = await fetch(`${API_BASE_URL}/api/assignments/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    teacherId: id,
                    ...form
                })
            });

            console.log('Response status:', res.status);
            console.log('Response ok:', res.ok);

            if (res.ok) {
                const result = await res.json();
                console.log('Assignment created successfully:', result);
                
                // Trigger custom event to update assignments tab in real-time
                window.dispatchEvent(new CustomEvent('assignmentCreated', { 
                    detail: result 
                }));
                
                navigate(`/dash/teacher/${id}/assignments`);
            } else {
                const err = await res.json();
                console.error('Failed to create assignment:', err);
                alert(`Failed to create assignment: ${err.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Error:', err);
            alert(`Error creating assignment: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-assignment">
            <div className="background-decoration">
                <div className="decoration-circle decoration-circle-1"></div>
                <div className="decoration-circle decoration-circle-2"></div>
                <div className="decoration-circle decoration-circle-3"></div>
            </div>

            <div className="form-container">
                <div className="form-header">
                    <h2 className="form-title">Create Assignment</h2>
                    <p className="form-subtitle">Fill in the details to create a new assignment</p>
                </div>

                <form onSubmit={handleSubmit} className="assignment-form" noValidate>
                    {/* MAIN INFO SECTION */}
                    <div className="form-section">
                        <div className="form-group">
                            <label htmlFor="title" className="form-label">
                                Assignment Title <span className="required">*</span>
                            </label>
                            <input
                                id="title"
                                name="title"
                                type="text"
                                placeholder="Enter assignment title"
                                value={form.title}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={`form-input ${errors.title && touched.title ? 'error' : ''} ${touched.title && !errors.title ? 'success' : ''}`}
                                required
                                aria-invalid={errors.title ? 'true' : 'false'}
                                aria-describedby={errors.title ? 'title-error' : undefined}
                            />
                            {errors.title && touched.title && (
                                <span id="title-error" className="error-message" role="alert">
                                    {errors.title}
                                </span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="description" className="form-label">
                                Assignment Description <span className="required">*</span>
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                placeholder="Provide detailed instructions for the assignment"
                                value={form.description}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={`form-textarea ${errors.description && touched.description ? 'error' : ''} ${touched.description && !errors.description ? 'success' : ''}`}
                                required
                                rows="5"
                                aria-invalid={errors.description ? 'true' : 'false'}
                                aria-describedby={errors.description ? 'description-error' : undefined}
                            />
                            {errors.description && touched.description && (
                                <span id="description-error" className="error-message" role="alert">
                                    {errors.description}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* META DATA SECTION */}
                    <div className="form-section">
                        <h3 className="section-title">Assignment Details</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="subject" className="form-label">
                                    Subject <span className="required">*</span>
                                </label>
                                <input
                                    id="subject"
                                    name="subject"
                                    type="text"
                                    placeholder="e.g., Mathematics"
                                    value={form.subject}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={`form-input ${errors.subject && touched.subject ? 'error' : ''} ${touched.subject && !errors.subject ? 'success' : ''}`}
                                    required
                                    aria-invalid={errors.subject ? 'true' : 'false'}
                                    aria-describedby={errors.subject ? 'subject-error' : undefined}
                                />
                                {errors.subject && touched.subject && (
                                    <span id="subject-error" className="error-message" role="alert">
                                        {errors.subject}
                                    </span>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="section" className="form-label">
                                    Section <span className="required">*</span>
                                </label>
                                <input
                                    id="section"
                                    name="section"
                                    type="text"
                                    placeholder="e.g., A, B, C"
                                    value={form.section}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={`form-input ${errors.section && touched.section ? 'error' : ''} ${touched.section && !errors.section ? 'success' : ''}`}
                                    required
                                    aria-invalid={errors.section ? 'true' : 'false'}
                                    aria-describedby={errors.section ? 'section-error' : undefined}
                                />
                                {errors.section && touched.section && (
                                    <span id="section-error" className="error-message" role="alert">
                                        {errors.section}
                                    </span>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="semester" className="form-label">
                                    Semester <span className="required">*</span>
                                </label>
                                <input
                                    id="semester"
                                    name="semester"
                                    type="text"
                                    placeholder="e.g., Fall 2024"
                                    value={form.semester}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={`form-input ${errors.semester && touched.semester ? 'error' : ''} ${touched.semester && !errors.semester ? 'success' : ''}`}
                                    required
                                    aria-invalid={errors.semester ? 'true' : 'false'}
                                    aria-describedby={errors.semester ? 'semester-error' : undefined}
                                />
                                {errors.semester && touched.semester && (
                                    <span id="semester-error" className="error-message" role="alert">
                                        {errors.semester}
                                    </span>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="dueDate" className="form-label">
                                    Due Date <span className="required">*</span>
                                </label>
                                <input
                                    id="dueDate"
                                    name="dueDate"
                                    type="date"
                                    value={form.dueDate}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={`form-input ${errors.dueDate && touched.dueDate ? 'error' : ''} ${touched.dueDate && !errors.dueDate ? 'success' : ''}`}
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    aria-invalid={errors.dueDate ? 'true' : 'false'}
                                    aria-describedby={errors.dueDate ? 'dueDate-error' : undefined}
                                />
                                {errors.dueDate && touched.dueDate && (
                                    <span id="dueDate-error" className="error-message" role="alert">
                                        {errors.dueDate}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            disabled={loading}
                            className="cancel-btn"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || Object.keys(errors).some(key => errors[key])}
                            className="submit-btn"
                        >
                            {loading ? (
                                <span className="loading-spinner">
                                    <span className="spinner"></span>
                                    Creating...
                                </span>
                            ) : (
                                'Create Assignment'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateAssignment;

