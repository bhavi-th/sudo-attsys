import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import '../../styles/student/QRScanner.css';
import toast from 'react-hot-toast';

function QRScanner() {
    const [scanResult, setScanResult] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const scanner = new Html5QrcodeScanner('qr-reader', {
            fps: 15,
            qrbox: { width: 200, height: 200 },
            aspectRatio: 1.0,
            supportedScanTypes: [0],
            rememberLastUsedCamera: true,
        });

        const onScanSuccess = async (decodedText) => {
            scanner.clear();
            setScanResult(decodedText);

            const [branch, subject, section, passkey, semester] = decodedText.split('|');

            // Validate QR code format
            if (!branch || !subject || !section || !passkey || !semester) {
                toast.error('Invalid QR Code Format');
                return;
            }

            try {
                const API_BASE_URL = import.meta.env.VITE_PORT
                    ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
                    : import.meta.env.VITE_URL;
                    
                toast.loading('Verifying QR Code...', { id: 'qr-verify' });
                
                // First find the session to get sessionId
                const sessionResponse = await fetch(`${API_BASE_URL}/api/session/find`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        passkey,
                        branch,
                        subject,
                        section: Number(section),
                        semester: Number(semester),
                    }),
                });
                
                const sessionData = await sessionResponse.json();
                
                if (!sessionResponse.ok || !sessionData.success) {
                    toast.dismiss('qr-verify');
                    toast.error('Session not found or expired', { id: 'session-error' });
                    return;
                }
                
                const response = await fetch(`${API_BASE_URL}/api/attendance/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        branch,
                        subject,
                        section: Number(section),
                        semester: Number(semester),
                        passkey,
                        studentId: user?.id,
                        sessionId: sessionData.data._id, // Pass the sessionId
                    }),
                });

                const data = await response.json();
                toast.dismiss('qr-verify');

                if (response.ok) {
                    // Backend successfully marked attendance
                    toast.success('Attendance Marked Successfully!', { id: 'attendance-success' });
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    const errorMessage = data.error || 'Verification failed';
                    // Provide more helpful message for session-based attendance
                    if (errorMessage.includes('session today')) {
                        toast.error('Attendance already recorded for this session today. You can attend a different session.', { 
                            id: 'attendance-error',
                            duration: 5000 
                        });
                    } else {
                        toast.error(errorMessage, { id: 'attendance-error' });
                    }
                }
            } catch (err) {
                console.error('Verification Error:', err);
                toast.dismiss('qr-verify');
                toast.error('Server Connection Failed', { id: 'connection-error' });
            }
        };

        scanner.render(onScanSuccess, () => {});

        return () => {
            scanner.clear().catch((e) => console.warn('Cleanup error', e));
        };
    }, [user, navigate]);

    return (
        <div className="qrscanner-container">
            <h2 className="qrscanner-title">Scan Attendance</h2>
            <div className="scanner-wrapper">
                <div id="qr-reader"></div>
            </div>
            <b>
                * Select the correct camera carefully — your choice will be saved and used for
                future scans.
            </b>

            <div className="status-box">
                {scanResult ? (
                    <p className="success-msg">Processing Code...</p>
                ) : (
                    <p>Place the QR code inside the frame</p>
                )}
            </div>
        </div>
    );
}

export default QRScanner;
