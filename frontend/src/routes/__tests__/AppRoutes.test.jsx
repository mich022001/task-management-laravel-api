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
                id: 1,
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
                id: 1,
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

        expect(screen.getByText('System Admin')).toBeInTheDocument();
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
                id: 1,
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

    test('redirects a manager away from the Users page', () => {
        renderAppRoutes({
            initialEntries: ['/users'],
            user: {
                id: 2,
                name: 'Team Manager',
                role: 'manager',
            },
            isAuthenticated: true,
        });

        expect(
            screen.getByRole('heading', {
                name: '403',
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByText('You do not have permission to view this page.'),
        ).toBeInTheDocument();
    });

    test('redirects a team member away from the Teams page', () => {
        renderAppRoutes({
            initialEntries: ['/teams'],
            user: {
                id: 3,
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
                id: 3,
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
