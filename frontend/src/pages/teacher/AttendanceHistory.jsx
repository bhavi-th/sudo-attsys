import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import '../../styles/teacher/AttendanceHistory.css';

const AttendanceHistory = () => {
    const SESSION_MERGE_WINDOW_MS = 5 * 60 * 1000;
    const { id } = useParams();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [selectedHistorySubject, setSelectedHistorySubject] = useState('');
    const [selectedHistoryDate, setSelectedHistoryDate] = useState('');
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(10);
    
    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    
    // UI states
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!id) return;

            try {
                const API_BASE_URL = import.meta.env.VITE_PORT
                    ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
                    : import.meta.env.VITE_URL;

                const response = await fetch(`${API_BASE_URL}/api/profile/${id}`);
                const data = await response.json();

                if (response.ok) {
                    setCourses(data.courses || []);
                } else {
                    console.error('Profile fetch error:', data.error);
                }
            } catch (error) {
                console.error('Connection error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [id]);

    useEffect(() => {
        const fetchAttendanceHistory = async () => {
            if (!id) return;

            try {
                const API_BASE_URL = import.meta.env.VITE_PORT
                    ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
                    : import.meta.env.VITE_URL;

                const response = await fetch(`${API_BASE_URL}/api/attendance/history/${id}`);
                const data = await response.json();

                if (response.ok) {
                    setAttendanceHistory(Array.isArray(data) ? data : []);
                } else {
                    console.error('Attendance history fetch error:', data.error);
                }
            } catch (error) {
                console.error('Connection error fetching attendance history:', error);
            } finally {
                setHistoryLoading(false);
            }
        };

        fetchAttendanceHistory();
    }, [id]);

    const historyBySubjectAndDate = attendanceHistory.reduce((acc, record) => {
        const recordDate = new Date(record.date);
        const dateKey = recordDate.toISOString().split('T')[0];
        const subjectKey = record.subject;

        if (!acc[subjectKey]) {
            acc[subjectKey] = {};
        }

        if (!acc[subjectKey][dateKey]) {
            acc[subjectKey][dateKey] = [];
        }

        acc[subjectKey][dateKey].push(record);
        return acc;
    }, {});

    const groupedHistoryBySubjectAndDate = Object.entries(historyBySubjectAndDate).reduce(
        (subjectAcc, [subjectKey, dateMap]) => {
            subjectAcc[subjectKey] = {};

            Object.entries(dateMap).forEach(([dateKey, records]) => {
                const sortedRecords = [...records].sort(
                    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
                );

                const sessions = [];

                sortedRecords.forEach((record) => {
                    const currentTime = new Date(record.date).getTime();
                    const previousSession = sessions[sessions.length - 1];
                    const recordContextKey = `${record.branch}-${record.section}-${record.semester}`;

                    if (!previousSession) {
                        sessions.push({
                            start: currentTime,
                            end: currentTime,
                            contextKey: recordContextKey,
                            records: [record],
                        });
                        return;
                    }

                    const gap = currentTime - previousSession.end;
                    if (gap <= SESSION_MERGE_WINDOW_MS && previousSession.contextKey === recordContextKey) {
                        previousSession.end = currentTime;
                        previousSession.records.push(record);
                        return;
                    }

                    sessions.push({
                        start: currentTime,
                        end: currentTime,
                        contextKey: recordContextKey,
                        records: [record],
                    });
                });

                const timeBuckets = {};
                sessions.forEach((session) => {
                    const startLabel = new Date(session.start).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                    });
                    const endLabel = new Date(session.end).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                    });
                    const label = startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
                    timeBuckets[label] = session.records;
                });

                subjectAcc[subjectKey][dateKey] = timeBuckets;
            });

            return subjectAcc;
        },
        {},
    );

    const historySubjects = courses.map((course) => course.subject);
    const availableDatesForSubject = selectedHistorySubject
        ? Object.keys(groupedHistoryBySubjectAndDate[selectedHistorySubject] || {}).sort((a, b) =>
              b.localeCompare(a),
          )
        : [];
    const selectedDateRecords =
        groupedHistoryBySubjectAndDate[selectedHistorySubject]?.[selectedHistoryDate] || {};
    
    // Get all records for the selected date and subject
    const getAllRecordsForSelectedDate = () => {
        if (!selectedHistorySubject || !selectedHistoryDate) return [];
        const timeRecords = selectedDateRecords;
        const allRecords = [];
        
        Object.values(timeRecords).forEach(records => {
            allRecords.push(...records);
        });
        
        return allRecords;
    };
    
    // Filter and sort records
    const getFilteredAndSortedRecords = () => {
        let records = getAllRecordsForSelectedDate();
        
        // Apply search filter
        if (searchTerm) {
            records = records.filter(record => 
                record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.usn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.section.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Apply status filter
        if (filterStatus !== 'all') {
            records = records.filter(record => record.status === filterStatus);
        }
        
        // Apply sorting
        records.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'name':
                    aValue = a.studentName.toLowerCase();
                    bValue = b.studentName.toLowerCase();
                    break;
                case 'usn':
                    aValue = a.usn.toLowerCase();
                    bValue = b.usn.toLowerCase();
                    break;
                case 'status':
                    aValue = a.status;
                    bValue = b.status;
                    break;
                case 'date':
                default:
                    aValue = new Date(a.date).getTime();
                    bValue = new Date(b.date).getTime();
                    break;
            }
            
            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
        
        return records;
    };
    
    // Pagination logic
    const filteredRecords = getFilteredAndSortedRecords();
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const currentRecords = filteredRecords.slice(startIndex, endIndex);
    
        
    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, sortBy, sortOrder, selectedHistorySubject, selectedHistoryDate]);
    
    // Helper functions
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    
    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
        
    const getStatusIcon = (status) => {
        switch (status) {
            case 'present': return '✓';
            case 'absent': return '✗';
            case 'late': return '⏰';
            default: return '?';
        }
    };
    
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };
    
    const clearFilters = () => {
        setSearchTerm('');
        setFilterStatus('all');
        setSortBy('date');
        setSortOrder('desc');
    };
    
    const hasActiveFilters = searchTerm || filterStatus !== 'all';

    if (loading) {
        return (
            <div className="attendance-history loading-state">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <div className="loading-text">Loading Attendance History...</div>
                    <div className="loading-subtitle">Please wait while we fetch your attendance records</div>
                </div>
            </div>
        );
    }

    return (
        <div className="attendance-history">
            <div className="dashboard-container">
                {/* Header */}
                <header className="history-header">
                    <div className="header-content">
                        <h1 className="page-title">
                            <span className="title-icon">📊</span>
                            Attendance History
                        </h1>
                        <div className="header-actions">
                            <Link to={`/dash/teacher/${id}`}>
                                <button className="back-btn">
                                    <span className="btn-icon">�</span>
                                    Back to Dashboard
                                </button>
                            </Link>
                        </div>
                    </div>
                </header>

                
                <div className="history-content">
                    {historyLoading ? (
                        <div className="loading-state">
                            <div className="loading-spinner"></div>
                            <p>Loading attendance history...</p>
                        </div>
                    ) : attendanceHistory.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">�</div>
                            <h3>No Attendance History Yet</h3>
                            <p>Once you start taking attendance for your classes, your records will appear here. Select a subject and date to view detailed attendance information.</p>
                        </div>
                    ) : (
                        <>
                            {/* Subject Selection */}
                            <section className="subject-selection compact">
                                <h3 className="section-title">📚 Choose a Subject</h3>
                                <div className="subjects-list">
                                    {historySubjects.map((subject) => {
                                        const hasHistory = Boolean(
                                            groupedHistoryBySubjectAndDate[subject] &&
                                                Object.keys(groupedHistoryBySubjectAndDate[subject]).length > 0,
                                        );
                                        const subjectStats = groupedHistoryBySubjectAndDate[subject] || {};
                                        const totalSessions = Object.keys(subjectStats).length;

                                        return (
                                            <button
                                                className={`subject-btn ${
                                                    selectedHistorySubject === subject ? 'active' : ''
                                                } ${!hasHistory ? 'disabled' : ''}`}
                                                key={`history-${subject}`}
                                                onClick={() => {
                                                    if (hasHistory) {
                                                        setSelectedHistorySubject(subject);
                                                        setSelectedHistoryDate('');
                                                    }
                                                }}
                                                disabled={!hasHistory}
                                            >
                                                <span className="subject-name">{subject}</span>
                                                {hasHistory && (
                                                    <span className="session-badge">{totalSessions} sessions</span>
                                                )}
                                                {!hasHistory && (
                                                    <span className="session-badge" style={{ opacity: 0.5 }}>No data</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                {historySubjects.length === 0 && (
                                    <p className="no-subjects-message">No subjects available. Please check your profile settings.</p>
                                )}
                            </section>

                            {/* Date Selection */}
                            {selectedHistorySubject && (
                                <section className="date-selection compact">
                                    <h3 className="section-title">📅 Select a Date for {selectedHistorySubject}</h3>
                                    {availableDatesForSubject.length === 0 ? (
                                        <div className="empty-state compact">
                                            <div className="empty-icon">📭</div>
                                            <h4>No Attendance Records</h4>
                                            <p>No attendance has been taken for this subject yet. Start a new session to see records here.</p>
                                        </div>
                                    ) : (
                                        <div className="dates-list">
                                            {availableDatesForSubject.map((dateKey) => {
                                                const dateRecords = groupedHistoryBySubjectAndDate[selectedHistorySubject][dateKey];
                                                const totalStudents = Object.values(dateRecords).reduce((sum, records) => sum + records.length, 0);
                                                
                                                return (
                                                    <button
                                                        className={`date-btn ${
                                                            selectedHistoryDate === dateKey ? 'active' : ''
                                                        }`}
                                                        key={dateKey}
                                                        onClick={() => setSelectedHistoryDate(dateKey)}
                                                    >
                                                        <span className="date-info">
                                                            <span className="date-main">{formatDate(dateKey)}</span>
                                                            <span className="date-detail">{totalStudents} students recorded</span>
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </section>
                            )}
                            
                            {!selectedHistorySubject && (
                                <div className="selection-prompt compact">
                                    <div className="prompt-icon">�</div>
                                    <h4>Get Started</h4>
                                    <p>Select a subject from above to view attendance history. Once you choose a subject, you can select specific dates to see detailed records.</p>
                                </div>
                            )}

                            {/* Attendance Records */}
                            {selectedHistoryDate && (
                                <section className="records-section compact">
                                    <div className="records-header">
                                        <h3 className="section-title">📋 Attendance Records - {formatDate(selectedHistoryDate)}</h3>
                                        <div className="view-controls">
                                            <button
                                                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                                onClick={() => setViewMode('grid')}
                                                title="View as cards"
                                            >
                                                Grid View
                                            </button>
                                            <button
                                                className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                                                onClick={() => setViewMode('table')}
                                                title="View as table"
                                            >
                                                Table View
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Search and Filters */}
                                    <div className="search-filters compact">
                                        <div className="filters-row">
                                            <div className="search-input-wrapper">
                                                <span className="search-icon"></span>
                                                <input
                                                    type="text"
                                                    placeholder="Search by name, USN, branch..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="search-input"
                                                    aria-label="Search students"
                                                />
                                                {searchTerm && (
                                                    <button
                                                        onClick={() => setSearchTerm('')}
                                                        className="clear-search-btn"
                                                        title="Clear search"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                            
                                            <select
                                                value={filterStatus}
                                                onChange={(e) => setFilterStatus(e.target.value)}
                                                className="filter-select compact"
                                            >
                                                <option value="all">All Status</option>
                                                <option value="present">Present</option>
                                                <option value="absent">Absent</option>
                                                <option value="late">Late</option>
                                            </select>
                                            
                                            <select
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value)}
                                                className="filter-select compact"
                                            >
                                                <option value="date">Date</option>
                                                <option value="name">Name</option>
                                                <option value="usn">USN</option>
                                                <option value="status">Status</option>
                                            </select>
                                            
                                            <select
                                                value={recordsPerPage}
                                                onChange={(e) => setRecordsPerPage(Number(e.target.value))}
                                                className="filter-select compact"
                                            >
                                                <option value={5}>5</option>
                                                <option value={10}>10</option>
                                                <option value={20}>20</option>
                                                <option value={50}>50</option>
                                            </select>
                                            
                                            {hasActiveFilters && (
                                                <button
                                                    onClick={clearFilters}
                                                    className="clear-filters-btn compact"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Results Summary */}
                                    <div className="results-summary compact">
                                        <span className="results-count">
                                            {filteredRecords.length} records
                                            {hasActiveFilters && ` (filtered from ${getAllRecordsForSelectedDate().length})`}
                                        </span>
                                    </div>
                                    
                                    {/* Records Display */}
                                    {currentRecords.length === 0 ? (
                                        <div className="empty-state compact">
                                            <p>
                                                {hasActiveFilters 
                                                    ? 'No records match your filters'
                                                    : 'No attendance records found'
                                                }
                                            </p>
                                            {hasActiveFilters && (
                                                <button
                                                    onClick={clearFilters}
                                                    className="clear-filters-btn compact"
                                                >
                                                    Clear Filters
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            {viewMode === 'grid' ? (
                                                <div className="records-grid compact">
                                                    {currentRecords.map((record) => (
                                                        <div
                                                            className="record-card compact"
                                                            key={`${record._id}-${record.usn}`}
                                                        >
                                                            <div className="record-header">
                                                                <div className="student-info">
                                                                    <h4 className="student-name">{record.studentName}</h4>
                                                                    <span className="student-usn">{record.usn}</span>
                                                                </div>
                                                                <div className={`status-badge ${record.status}`}>
                                                                    <span className="status-icon">{getStatusIcon(record.status)}</span>
                                                                    {record.status}
                                                                </div>
                                                            </div>
                                                            <div className="record-meta">
                                                                <span className="meta-item">{record.branch} • Sec {record.section}</span>
                                                                <span className="meta-item">Sem {record.semester}</span>
                                                                <span className="meta-item">{formatTime(record.date)}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="records-table">
                                                    <table>
                                                        <thead>
                                                            <tr>
                                                                <th onClick={() => handleSort('name')} className="sortable">
                                                                    Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                                                                </th>
                                                                <th onClick={() => handleSort('usn')} className="sortable">
                                                                    USN {sortBy === 'usn' && (sortOrder === 'asc' ? '↑' : '↓')}
                                                                </th>
                                                                <th onClick={() => handleSort('status')} className="sortable">
                                                                    Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                                                                </th>
                                                                <th>Branch</th>
                                                                <th>Section</th>
                                                                <th>Semester</th>
                                                                <th onClick={() => handleSort('date')} className="sortable">
                                                                    Time {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {currentRecords.map((record) => (
                                                                <tr key={`${record._id}-${record.usn}`}>
                                                                    <td className="student-name">{record.studentName}</td>
                                                                    <td className="student-usn">{record.usn}</td>
                                                                    <td>
                                                                        <span className={`status-badge ${record.status}`}>
                                                                            <span className="status-icon">{getStatusIcon(record.status)}</span>
                                                                            {record.status}
                                                                        </span>
                                                                    </td>
                                                                    <td>{record.branch}</td>
                                                                    <td>{record.section}</td>
                                                                    <td>{record.semester}</td>
                                                                    <td>{formatTime(record.date)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                            
                                            {/* Pagination */}
                                            {totalPages > 1 && (
                                                <div className="pagination compact">
                                                    <div className="pagination-controls">
                                                        <button
                                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                            disabled={currentPage === 1}
                                                            className="pagination-btn"
                                                        >
                                                            ←
                                                        </button>
                                                        
                                                        <div className="page-numbers">
                                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                                let pageNum;
                                                                if (totalPages <= 5) {
                                                                    pageNum = i + 1;
                                                                } else if (currentPage <= 3) {
                                                                    pageNum = i + 1;
                                                                } else if (currentPage >= totalPages - 2) {
                                                                    pageNum = totalPages - 4 + i;
                                                                } else {
                                                                    pageNum = currentPage - 2 + i;
                                                                }
                                                                
                                                                return (
                                                                    <button
                                                                        key={pageNum}
                                                                        onClick={() => setCurrentPage(pageNum)}
                                                                        className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                                                                    >
                                                                        {pageNum}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        
                                                        <button
                                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                            disabled={currentPage === totalPages}
                                                            className="pagination-btn"
                                                        >
                                                            →
                                                        </button>
                                                    </div>
                                                    <div className="pagination-info">
                                                        Page {currentPage} of {totalPages}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </section>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceHistory;
