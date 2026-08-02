import { NavLink } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth.js';

const navigationItems = [
    {
        label: 'Dashboard',
        to: '/dashboard',
        roles: ['admin', 'manager', 'team_member'],
    },
    {
        label: 'Tasks',
        to: '/tasks',
        roles: ['admin', 'manager', 'team_member'],
    },
    {
        label: 'Teams',
        to: '/teams',
        roles: ['admin', 'manager'],
    },
    {
        label: 'Users',
        to: '/users',
        roles: ['admin'],
    },
    {
        label: 'Analytics',
        to: '/analytics',
        roles: ['admin', 'manager'],
    },
];

export default function Navigation() {
    const { user } = useAuth();

    const visibleItems = navigationItems.filter((item) =>
        item.roles.includes(user.role),
    );

    return (
        <nav aria-label="Main navigation">
            <ul className="navigation-list">
                {visibleItems.map((item) => (
                    <li key={item.to}>
                        <NavLink
                            to={item.to}
                            className={({ isActive }) =>
                                isActive
                                    ? 'navigation-link navigation-link-active'
                                    : 'navigation-link'
                            }
                        >
                            {item.label}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
