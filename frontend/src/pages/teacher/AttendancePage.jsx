import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import Table from '../../components/Table';
import DownloadPDF from '../../assets/download.svg';
import '../../styles/teacher/AttendancePage.css';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AttendancePage = () => {
    const API_BASE_URL = import.meta.env.VITE_PORT
        ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
        : import.meta.env.VITE_URL;
    const { user } = useAuth();
    const { branch, subject: subjectName, sectionName, semester } = useParams();

    const [qr, setQr] = useState(null);
    const [attendanceList, setAttendanceList] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0);

    const timerIdRef = useRef(null);

    useEffect(() => {
        const fetchAttendance = async () => {
            if (user?.role === 'teacher' && user?.id && sectionName && subjectName) {
                try {
                    const response = await fetch(
                        `${API_BASE_URL}/api/attendance/list/${user.id}/${branch}/${subjectName}/${sectionName}/${semester}`,
                    );
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
    }, [user, branch, sectionName, subjectName, API_BASE_URL, semester]);

    const generateQR = () => {
        if (timerIdRef.current) clearInterval(timerIdRef.current);

        const baseUrl = `${API_BASE_URL}/qr`;
        const params = `teacherId=${user.id}&branch=${branch}&subject=${subjectName}&section=${sectionName}&semester=${semester}&time=${Date.now()}`;

        setQr(`${baseUrl}?${params}`);
        setTimeLeft(10);

        timerIdRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerIdRef.current);
                    setQr(null);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const stopSession = () => {
        if (timerIdRef.current) clearInterval(timerIdRef.current);
        setQr(null);
        setTimeLeft(0);
    };

    useEffect(() => {
        return () => {
            if (timerIdRef.current) clearInterval(timerIdRef.current);
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
                            disabled={timeLeft > 0}
                        >
                            {timeLeft > 0 ? 'Active' : 'Generate QR'}
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
