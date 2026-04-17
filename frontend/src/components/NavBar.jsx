import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import ProfilePic from '../assets/profile.svg';
import { usePWAInstall } from '../hooks/usePWAInstall.js';
import '../styles/NavBar.css';
import toast from 'react-hot-toast';

const NavBar = () => {
    const { isInstallable, install } = usePWAInstall();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const id = user?.id;

    const [userName, setUserName] = useState('Loading...');
    const [showLogout, setShowLogout] = useState(false);

    const menuRef = useRef(null);

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
                    setUserName(data.name);
                } else {
                    setUserName('User');
                    console.error('Profile fetch error:', data.error);
                }
            } catch (error) {
                setUserName('User');
                console.error('Connection error fetching profile:', error);
            }
        };

        fetchUserProfile();
    }, [id]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showLogout && menuRef.current && !menuRef.current.contains(event.target)) {
                setShowLogout(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showLogout]);

    function handleLogOut() {
        logout();
        toast.error('Logged Out successfully');
        navigate('/');
    }

    const toggleLogout = () => {
        setShowLogout(!showLogout);
    };

    return (
        <div className="NavBar">
            <div
                className="nav-logo"
                onClick={() => {
                    navigate('/');
                }}
            >
                AttSys2-0
            </div>

            <div className="profile-wrapper" ref={menuRef} style={{ position: 'relative' }}>
                <img
                    src={ProfilePic}
                    style={{ cursor: 'pointer' }}
                    alt="Profile"
                    onClick={toggleLogout}
                />

                {showLogout && (
                    <div id="nav-menu">
                        <p>Hi, {userName}</p>
                        {isInstallable && (
                            <button id="install-btn" onClick={install}>
                                Install App
                            </button>
                        )}
                        <button id="logout" onClick={handleLogOut}>
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NavBar;
