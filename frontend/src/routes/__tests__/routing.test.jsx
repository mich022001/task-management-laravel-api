import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, test } from 'vitest';

import { AuthContext } from '../../context/auth-context.js';
import ProtectedRoute from '../ProtectedRoute.jsx';
import RoleRoute from '../RoleRoute.jsx';

function renderWithAuth({
    user = null,
    isAuthenticated = false,
    isInitializing = false,
    initialEntries = ['/protected'],
    element,
}) {
    return render(
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                isInitializing,
                login: async () => {},
                logout: () => {},
            }}
        >
            <MemoryRouter initialEntries={initialEntries}>
                {element}
            </MemoryRouter>
        </AuthContext.Provider>,
    );
}

describe('ProtectedRoute', () => {
    test('shows the initialization message while restoring a session', () => {
        renderWithAuth({
            isInitializing: true,
            element: (
                <Routes>
                    <Route element={<ProtectedRoute />}>
                        <Route
                            path="/protected"
                            element={<p>Protected content</p>}
                        />
                    </Route>
                </Routes>
            ),
        });

        expect(
            screen.getByText('Restoring your session...'),
        ).toBeInTheDocument();
    });

    test('redirects unauthenticated users to login', () => {
        renderWithAuth({
            initialEntries: ['/protected'],
            element: (
                <Routes>
                    <Route path="/login" element={<p>Login page</p>} />

                    <Route element={<ProtectedRoute />}>
                        <Route
                            path="/protected"
                            element={<p>Protected content</p>}
                        />
                    </Route>
                </Routes>
            ),
        });

        expect(screen.getByText('Login page')).toBeInTheDocument();
        expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    });

    test('allows authenticated users to access protected content', () => {
        renderWithAuth({
            user: {
                id: 1,
                role: 'admin',
            },
            isAuthenticated: true,
            element: (
                <Routes>
                    <Route element={<ProtectedRoute />}>
                        <Route
                            path="/protected"
                            element={<p>Protected content</p>}
                        />
                    </Route>
                </Routes>
            ),
        });

        expect(screen.getByText('Protected content')).toBeInTheDocument();
    });
});

describe('RoleRoute', () => {
    test('allows an authorized role', () => {
        renderWithAuth({
            user: {
                id: 2,
                role: 'manager',
            },
            isAuthenticated: true,
            element: (
                <Routes>
                    <Route
                        element={
                            <RoleRoute allowedRoles={['admin', 'manager']} />
                        }
                    >
                        <Route
                            path="/protected"
                            element={<p>Manager content</p>}
                        />
                    </Route>
                </Routes>
            ),
        });

        expect(screen.getByText('Manager content')).toBeInTheDocument();
    });

    test('redirects an unauthorized role to forbidden', () => {
        renderWithAuth({
            user: {
                id: 3,
                role: 'team_member',
            },
            isAuthenticated: true,
            element: (
                <Routes>
                    <Route path="/forbidden" element={<p>Forbidden page</p>} />

                    <Route
                        element={
                            <RoleRoute allowedRoles={['admin', 'manager']} />
                        }
                    >
                        <Route
                            path="/protected"
                            element={<p>Restricted content</p>}
                        />
                    </Route>
                </Routes>
            ),
        });

        expect(screen.getByText('Forbidden page')).toBeInTheDocument();

        expect(
            screen.queryByText('Restricted content'),
        ).not.toBeInTheDocument();
    });

    test('redirects to login when no authenticated user exists', () => {
        renderWithAuth({
            element: (
                <Routes>
                    <Route path="/login" element={<p>Login page</p>} />

                    <Route element={<RoleRoute allowedRoles={['admin']} />}>
                        <Route
                            path="/protected"
                            element={<p>Admin content</p>}
                        />
                    </Route>
                </Routes>
            ),
        });

        expect(screen.getByText('Login page')).toBeInTheDocument();
    });
});
