import { NavLink } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth.js';
import Icon from '../ui/Icon.jsx';

const navigationItems = [
    {
        label: 'Dashboard',
        to: '/dashboard',
        icon: 'dashboard',
        roles: ['admin', 'manager', 'team_member'],
    },
    {
        label: 'Tasks',
        to: '/tasks',
        icon: 'tasks',
        roles: ['admin', 'manager', 'team_member'],
    },
    {
        label: 'Teams',
        to: '/teams',
        icon: 'teams',
        roles: ['admin', 'manager'],
    },
    {
        label: 'Users',
        to: '/users',
        icon: 'users',
        roles: ['admin'],
    },
    {
        label: 'Analytics',
        to: '/analytics',
        icon: 'analytics',
        roles: ['admin', 'manager'],
    },
    {
        label: 'Settings',
        to: '/settings',
        icon: 'bell',
        roles: ['admin', 'manager', 'team_member'],
    },
];

export default function Navigation({ onNavigate }) {
    const { user } = useAuth();

    const visibleItems = navigationItems.filter((item) =>
        item.roles.includes(user.role),
    );

    return (
        <nav className="sidebar-navigation" aria-label="Main navigation">
            <p className="navigation-section-label">Menu</p>

            <ul className="navigation-list">
                {visibleItems.map((item) => (
                    <li key={item.to}>
                        <NavLink
                            to={item.to}
                            onClick={onNavigate}
                            className={({ isActive }) =>
                                isActive
                                    ? 'navigation-link navigation-link-active'
                                    : 'navigation-link'
                            }
                        >
                            <span className="navigation-icon">
                                <Icon name={item.icon} size={19} />
                            </span>

                            <span>{item.label}</span>
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
