import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.js';

export default function ProtectedRoute() {
    const { isAuthenticated, isInitializing } = useAuth();

    const location = useLocation();

    if (isInitializing) {
        return (
            <main className="route-message">
                <p>Restoring your session...</p>
            </main>
        );
    }

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: location,
                }}
            />
        );
    }

    return <Outlet />;
}
