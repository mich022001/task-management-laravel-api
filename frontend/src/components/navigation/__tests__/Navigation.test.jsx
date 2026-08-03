import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';

import { AuthContext } from '../../../context/auth-context.js';
import Navigation from '../Navigation.jsx';

function renderNavigation(user) {
    return render(
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: true,
                isInitializing: false,
                login: async () => {},
                logout: () => {},
            }}
        >
            <MemoryRouter>
                <Navigation />
            </MemoryRouter>
        </AuthContext.Provider>,
    );
}

describe('Role-aware navigation', () => {
    test('admin sees every navigation item', () => {
        renderNavigation({
            id: '44444444-4444-4444-8444-444444444444',
            role: 'admin',
        });

        expect(
            screen.getByRole('link', { name: 'Dashboard' }),
        ).toBeInTheDocument();

        expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();

        expect(screen.getByRole('link', { name: 'Teams' })).toBeInTheDocument();

        expect(screen.getByRole('link', { name: 'Users' })).toBeInTheDocument();

        expect(
            screen.getByRole('link', { name: 'Analytics' }),
        ).toBeInTheDocument();

        expect(
            screen.getByRole('link', { name: 'Settings' }),
        ).toBeInTheDocument();
    });

    test('manager sees the Users link', () => {
        renderNavigation({
            id: '22222222-2222-4222-8222-222222222222',
            role: 'manager',
        });

        expect(
            screen.getByRole('link', { name: 'Dashboard' }),
        ).toBeInTheDocument();

        expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();

        expect(screen.getByRole('link', { name: 'Teams' })).toBeInTheDocument();

        expect(screen.getByRole('link', { name: 'Users' })).toBeInTheDocument();

        expect(
            screen.getByRole('link', { name: 'Analytics' }),
        ).toBeInTheDocument();

        expect(
            screen.getByRole('link', { name: 'Settings' }),
        ).toBeInTheDocument();
    });

    test('team member sees only Dashboard and Tasks', () => {
        renderNavigation({
            id: '33333333-3333-4333-8333-333333333333',
            role: 'team_member',
        });

        expect(
            screen.getByRole('link', { name: 'Dashboard' }),
        ).toBeInTheDocument();

        expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();

        expect(
            screen.getByRole('link', { name: 'Settings' }),
        ).toBeInTheDocument();

        expect(
            screen.queryByRole('link', { name: 'Teams' }),
        ).not.toBeInTheDocument();

        expect(
            screen.queryByRole('link', { name: 'Users' }),
        ).not.toBeInTheDocument();

        expect(
            screen.queryByRole('link', { name: 'Analytics' }),
        ).not.toBeInTheDocument();
    });
});
