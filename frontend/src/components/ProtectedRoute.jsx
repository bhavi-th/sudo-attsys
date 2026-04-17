import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const ProtectedRoute = ({ children, allowedRole }) => {
    const { user } = useAuth();

    if (!user) return <Navigate to="/" replace />;

    if (!user.isOnboarded) {
        if (location.pathname.startsWith('/onboard')) {
            return children;
        }
        return <Navigate to={`/onboard/${user.role}`} replace />;
    }

    if (allowedRole && user.role !== allowedRole) {
        return <Navigate to="/dash" replace />;
    }

    return children;
};

export default ProtectedRoute;
