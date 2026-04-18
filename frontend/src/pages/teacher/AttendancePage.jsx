import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import Table from '../../components/Table';
import DownloadPDF from '../../assets/download.svg';
import '../../styles/teacher/AttendancePage.css';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

const AttendancePage = () => {
    const API_BASE_URL = import.meta.env.VITE_PORT
        ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
        : import.meta.env.VITE_URL;
    const { user } = useAuth();
    const { branch, subject: subjectName, sectionName, semester } = useParams();

    const [qr, setQr] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [attendanceList, setAttendanceList] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0);

    const timerIdRef = useRef(null);
    const qrRefreshIdRef = useRef(null);

    useEffect(() => {
        const fetchAttendance = async () => {
            if (user?.role === 'teacher' && user?.id && sectionName && subjectName) {
                try {
                    let url = `${API_BASE_URL}/api/attendance/list/${user.id}/${branch}/${subjectName}/${sectionName}/${semester}`;
                    
                    // Add sessionId to query params if there's an active session
                    if (sessionId) {
                        url += `?sessionId=${sessionId}`;
                    }
                    
                    const response = await fetch(url);
                    if (response.ok) {
                        const data = await response.json();
                        setAttendanceList(data);
                    }
                } catch (err) {
                    console.error('Failed to fetch attendance:', err);
                }
            }
        };

        const interval = setInterval(fetchAttendance, 5000);
        fetchAttendance();
        return () => clearInterval(interval);
    }, [user, branch, sectionName, subjectName, API_BASE_URL, semester, sessionId]);

    const clearSessionTimers = () => {
        if (timerIdRef.current) {
            clearInterval(timerIdRef.current);
            timerIdRef.current = null;
        }
        if (qrRefreshIdRef.current) {
            clearInterval(qrRefreshIdRef.current);
            qrRefreshIdRef.current = null;
        }
    };

    const clearSessionState = () => {
        clearSessionTimers();
        setQr(null);
        setSessionId(null);
        setTimeLeft(0);
    };

    const generateQR = async () => {
        clearSessionTimers();

        try {
            const response = await fetch(`${API_BASE_URL}/session/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacherId: user.id,
                    branch,
                    subject: subjectName,
                    section: Number(sectionName),
                    semester: Number(semester),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to start session');
            }

            const nextSessionId = data.sessionId;
            const expiryMs = new Date(data.expiresAt).getTime();
            setSessionId(nextSessionId);
            setTimeLeft(Math.max(0, Math.ceil((expiryMs - Date.now()) / 1000)));

            const updateQrUrl = () => {
                setQr(`${API_BASE_URL}/qr?sessionId=${nextSessionId}&tick=${Date.now()}`);
            };

            updateQrUrl();
            qrRefreshIdRef.current = setInterval(updateQrUrl, 2000);

            timerIdRef.current = setInterval(() => {
                const remainingSeconds = Math.max(
                    0,
                    Math.ceil((expiryMs - Date.now()) / 1000),
                );
                setTimeLeft(remainingSeconds);

                if (remainingSeconds <= 0) {
                    clearSessionState();
                }
            }, 1000);
        } catch (err) {
            console.error('Failed to start QR session:', err);
            clearSessionState();
        }
    };

    const stopSession = async () => {
        const activeSessionId = sessionId;
        if (!activeSessionId) return;

        try {
            const response = await fetch(`${API_BASE_URL}/session/stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: activeSessionId }),
            });
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                toast.error(data.error || 'Could not stop session');
                return;
            }

            clearSessionState();
        } catch (err) {
            console.error('Failed to stop session:', err);
            toast.error('Failed to stop session');
        }
    };

    useEffect(() => {
        return () => {
            clearSessionTimers();
        };
    }, []);

    const downloadPDF = () => {
        if (!attendanceList || attendanceList.length === 0) return;

        const doc = new jsPDF('p', 'pt', 'a4');

        // Title and Date
        doc.setFontSize(16);
        doc.text(`${subjectName} - Section ${sectionName}`, 40, 40);
        doc.setFontSize(10);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 40, 60);

        autoTable(doc, {
            body: attendanceList,
            startY: 80,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },

            // 1. Define specific widths for columns
            columnStyles: {
                0: { cellWidth: 40 }, // S.No (narrow)
                1: { cellWidth: 200 }, // Name (wide)
                2: { cellWidth: 100 }, // USN
                3: { cellWidth: 'auto' }, // Status (takes remaining space)
            },

            // 2. Keep your red color logic for absent students
            didParseCell: (data) => {
                if (data.section === 'body') {
                    const rowData = data.row.raw;
                    if (rowData.Status !== 'Present') {
                        data.cell.styles.textColor = [255, 0, 0];
                    }
                }
            },
        });

        doc.save(`${subjectName}_${sectionName}_${new Date().toLocaleDateString()}.pdf`);
    };

    return (
        <div className="AttendancePage">
            {user?.role === 'teacher' && (
                <div className="scanner-holder">
                    <h1>{subjectName}</h1>
                    <h3>Section {sectionName}</h3>

                    <div className="qr-container">
                        {qr ? (
                            <img src={qr} className="qr-generator" alt="QR Code" />
                        ) : (
                            <div className="qr-placeholder"></div>
                        )}
                    </div>

                    <div className="button-holder">
                        <button
                            className="generate-btn"
                            onClick={generateQR}
                            disabled={Boolean(sessionId)}
                        >
                            {sessionId ? 'Active' : 'Generate QR'}
                        </button>
                        <button className="stop-btn" onClick={stopSession}>
                            Stop Session
                        </button>
                    </div>
                </div>
            )}

            <div className="student-timer">
                <div className="timer">
                    {timeLeft > 0 ? `QR Expires in: ${timeLeft}s` : 'Session Inactive'}
                </div>
                <Table data={attendanceList} />
                <button
                    className="pdf-btn"
                    onClick={downloadPDF}
                    disabled={attendanceList.length === 0}
                >
                    <img src={DownloadPDF} alt="Download" /> PDF
                </button>
            </div>
        </div>
    );
};

export default AttendancePage;
