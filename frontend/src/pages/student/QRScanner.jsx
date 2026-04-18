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

            try {
                const API_BASE_URL = import.meta.env.VITE_PORT
                    ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
                    : import.meta.env.VITE_URL;
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
                    }),
                });

                const data = await response.json();

                if (response.ok) {
                    // Backend successfully marked attendance
                    toast.success('Attendance Marked Successfully!');
                    navigate('/student/dashboard');
                } else {
                    toast.error(data.error || 'Verification failed');
                    window.location.reload();
                }
            } catch (err) {
                console.error('Verification Error:', err);
                toast.error('Server Connection Failed');
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
