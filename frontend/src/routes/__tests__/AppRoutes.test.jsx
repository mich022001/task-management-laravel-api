import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test, vi } from 'vitest';

import { AuthContext } from '../../context/auth-context.js';
import AppRoutes from '../AppRoutes.jsx';

function renderAppRoutes({
    initialEntries = ['/'],
    user = null,
    isAuthenticated = false,
    isInitializing = false,
} = {}) {
    const authValue = {
        user,
        isAuthenticated,
        isInitializing,
        login: vi.fn(),
        logout: vi.fn(),
    };

    render(
        <AuthContext.Provider value={authValue}>
            <MemoryRouter initialEntries={initialEntries}>
                <AppRoutes />
            </MemoryRouter>
        </AuthContext.Provider>,
    );

    return authValue;
}

describe('Application routes', () => {
    test('renders the public login page', () => {
        renderAppRoutes({
            initialEntries: ['/login'],
        });

        expect(
            screen.getByRole('heading', {
                name: 'Sign in',
            }),
        ).toBeInTheDocument();

        expect(screen.getByLabelText('Email')).toBeInTheDocument();

        expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    test('renders the public reset-password page', () => {
        renderAppRoutes({
            initialEntries: [
                '/reset-password?token=test-token&email=user%40test.com',
            ],
        });

        expect(
            screen.getByRole('heading', {
                name: 'Reset password',
            }),
        ).toBeInTheDocument();

        expect(screen.getByLabelText('Email')).toHaveValue('user@test.com');

        expect(screen.getByLabelText('New password')).toBeInTheDocument();

        expect(
            screen.getByLabelText('Confirm new password'),
        ).toBeInTheDocument();
    });

    test('redirects an unauthenticated dashboard request to login', () => {
        renderAppRoutes({
            initialEntries: ['/dashboard'],
        });

        expect(
            screen.getByRole('heading', {
                name: 'Sign in',
            }),
        ).toBeInTheDocument();

        expect(
            screen.queryByRole('heading', {
                name: 'Dashboard',
            }),
        ).not.toBeInTheDocument();
    });

    test('redirects the root path to dashboard for an authenticated user', () => {
        renderAppRoutes({
            initialEntries: ['/'],
            user: {
                id: '44444444-4444-4444-8444-444444444444',
                name: 'System Admin',
                role: 'admin',
            },
            isAuthenticated: true,
        });

        expect(
            screen.getByRole('heading', {
                name: 'Dashboard',
            }),
        ).toBeInTheDocument();
    });

    test('renders the dashboard for an authenticated user', () => {
        renderAppRoutes({
            initialEntries: ['/dashboard'],
            user: {
                id: '44444444-4444-4444-8444-444444444444',
                name: 'System Admin',
                role: 'admin',
            },
            isAuthenticated: true,
        });

        expect(
            screen.getByRole('heading', {
                name: 'Dashboard',
            }),
        ).toBeInTheDocument();

        expect(screen.getAllByText('System Admin').length).toBeGreaterThan(0);
    });

    test('renders the Not Found page for an unknown route', () => {
        renderAppRoutes({
            initialEntries: ['/unknown-page'],
        });

        expect(
            screen.getByRole('heading', {
                name: '404',
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByText('The requested page could not be found.'),
        ).toBeInTheDocument();
    });

    test('allows an admin to access the Users page', () => {
        renderAppRoutes({
            initialEntries: ['/users'],
            user: {
                id: '44444444-4444-4444-8444-444444444444',
                name: 'System Admin',
                role: 'admin',
            },
            isAuthenticated: true,
        });

        expect(
            screen.getByRole('heading', {
                name: 'Users',
            }),
        ).toBeInTheDocument();
    });

    test('allows a manager to access the Users page', () => {
        renderAppRoutes({
            initialEntries: ['/users'],
            user: {
                id: '22222222-2222-4222-8222-222222222222',
                name: 'Team Manager',
                role: 'manager',
            },
            isAuthenticated: true,
        });

        expect(
            screen.getByRole('heading', {
                name: 'Users',
            }),
        ).toBeInTheDocument();
    });

    test('redirects a team member away from the Users page', () => {
        renderAppRoutes({
            initialEntries: ['/users'],
            user: {
                id: '33333333-3333-4333-8333-333333333333',
                name: 'Team Member',
                role: 'team_member',
            },
            isAuthenticated: true,
        });

        expect(
            screen.getByRole('heading', {
                name: '403',
            }),
        ).toBeInTheDocument();
    });

    test('redirects a team member away from the Teams page', () => {
        renderAppRoutes({
            initialEntries: ['/teams'],
            user: {
                id: '33333333-3333-4333-8333-333333333333',
                name: 'Team Member',
                role: 'team_member',
            },
            isAuthenticated: true,
        });

        expect(
            screen.getByRole('heading', {
                name: '403',
            }),
        ).toBeInTheDocument();
    });

    test('redirects a team member away from the Analytics page', () => {
        renderAppRoutes({
            initialEntries: ['/analytics'],
            user: {
                id: '33333333-3333-4333-8333-333333333333',
                name: 'Team Member',
                role: 'team_member',
            },
            isAuthenticated: true,
        });

        expect(
            screen.getByRole('heading', {
                name: '403',
            }),
        ).toBeInTheDocument();
    });
});
