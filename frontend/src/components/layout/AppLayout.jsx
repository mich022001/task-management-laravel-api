import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import Navigation from '../navigation/Navigation.jsx';
import AppLogo from '../ui/AppLogo.jsx';
import Icon from '../ui/Icon.jsx';
import SidebarProfile from './SidebarProfile.jsx';

export default function AppLayout() {
    const [isNavigationOpen, setIsNavigationOpen] = useState(false);

    function closeNavigation() {
        setIsNavigationOpen(false);
    }

    function toggleNavigation() {
        setIsNavigationOpen((isOpen) => !isOpen);
    }

    useEffect(() => {
        if (!isNavigationOpen) {
            return undefined;
        }

        function handleEscape(event) {
            if (event.key === 'Escape') {
                closeNavigation();
            }
        }

        document.addEventListener('keydown', handleEscape);
        document.body.classList.add('navigation-drawer-open');

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.classList.remove('navigation-drawer-open');
        };
    }, [isNavigationOpen]);

    return (
        <div className="application-shell">
            <aside
                id="application-navigation"
                className={
                    isNavigationOpen
                        ? 'application-sidebar application-sidebar-open'
                        : 'application-sidebar'
                }
            >
                <div className="sidebar-header">
                    <AppLogo />

                    <button
                        type="button"
                        className="sidebar-close-button"
                        aria-label="Close navigation"
                        onClick={closeNavigation}
                    >
                        <Icon name="close" size={20} />
                    </button>
                </div>

                <Navigation onNavigate={closeNavigation} />

                <div className="sidebar-bottom">
                    <SidebarProfile />

                    <footer className="sidebar-version">
                        <Icon name="clipboard" size={16} />

                        <div>
                            <span>Task Management Platform</span>
                            <small>Version 1.0.0</small>
                        </div>
                    </footer>
                </div>
            </aside>

            {isNavigationOpen ? (
                <button
                    type="button"
                    className="navigation-backdrop"
                    aria-label="Close navigation"
                    onClick={closeNavigation}
                />
            ) : null}

            <div className="application-content">
                <header className="application-header">
                    <div className="application-header-context">
                        <span>Workspace</span>
                        <strong>Task Management Platform</strong>
                    </div>
                </header>

                <header className="mobile-application-header">
                    <button
                        type="button"
                        className="mobile-menu-button"
                        aria-label="Open navigation"
                        aria-controls="application-navigation"
                        aria-expanded={isNavigationOpen}
                        onClick={toggleNavigation}
                    >
                        <Icon name="menu" size={21} />
                    </button>

                    <div className="mobile-brand">
                        <strong>Task Management</strong>
                        <span>Workspace</span>
                    </div>
                </header>

                <main className="page-content">
                    <div className="page-container">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
