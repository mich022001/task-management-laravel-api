import { Outlet } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth.js';
import Navigation from '../navigation/Navigation.jsx';

export default function AppLayout() {
    const { user, logout } = useAuth();

    return (
        <div className="application-shell">
            <aside className="application-sidebar">
                <div>
                    <h1 className="application-title">Task Management</h1>

                    <p className="application-subtitle">Analytics Platform</p>
                </div>

                <Navigation />
            </aside>

            <div className="application-content">
                <header className="application-header">
                    <div>
                        <strong>{user.name}</strong>

                        <span className="user-role">
                            {user.role.replaceAll('_', ' ')}
                        </span>
                    </div>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={logout}
                    >
                        Log out
                    </button>
                </header>

                <main className="page-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
