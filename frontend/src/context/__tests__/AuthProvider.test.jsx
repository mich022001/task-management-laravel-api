import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AuthProvider } from '../AuthProvider.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import {
    AUTH_UNAUTHORIZED_EVENT,
    getAccessToken,
    setAccessToken,
} from '../../utils/authSession.js';

const loginUserMock = vi.fn();
const getAuthenticatedUserMock = vi.fn();
const logoutUserMock = vi.fn();

vi.mock('../../services/auth.service.js', () => ({
    loginUser: (...arguments_) => loginUserMock(...arguments_),
    getAuthenticatedUser: (...arguments_) =>
        getAuthenticatedUserMock(...arguments_),
    logoutUser: (...arguments_) => logoutUserMock(...arguments_),
}));

function wrapper({ children }) {
    return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthProvider', () => {
    beforeEach(() => {
        loginUserMock.mockReset();
        getAuthenticatedUserMock.mockReset();
        logoutUserMock.mockReset();

        logoutUserMock.mockResolvedValue({
            message: 'Logout successful.',
        });
    });

    test('starts unauthenticated when no token exists', () => {
        const { result } = renderHook(() => useAuth(), {
            wrapper,
        });

        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.isInitializing).toBe(false);
        expect(getAuthenticatedUserMock).not.toHaveBeenCalled();
    });

    test('logs in and stores the authenticated user and token', async () => {
        loginUserMock.mockResolvedValue({
            data: {
                user: {
                    id: '44444444-4444-4444-8444-444444444444',
                    name: 'System Admin',
                    email: 'admin@test.com',
                    role: 'admin',
                },
                access_token: 'admin-jwt-token',
            },
        });

        const { result } = renderHook(() => useAuth(), {
            wrapper,
        });

        await act(async () => {
            await result.current.login({
                email: 'admin@test.com',
                password: 'password123',
            });
        });

        expect(loginUserMock).toHaveBeenCalledWith({
            email: 'admin@test.com',
            password: 'password123',
        });

        expect(getAccessToken()).toBe('admin-jwt-token');

        expect(result.current.user).toEqual({
            id: '44444444-4444-4444-8444-444444444444',
            name: 'System Admin',
            email: 'admin@test.com',
            role: 'admin',
        });

        expect(result.current.isAuthenticated).toBe(true);
    });

    test('retrieves the user separately when login omits user data', async () => {
        loginUserMock.mockResolvedValue({
            data: {
                access_token: 'manager-jwt-token',
            },
        });

        getAuthenticatedUserMock.mockResolvedValue({
            data: {
                user: {
                    id: '22222222-2222-4222-8222-222222222222',
                    name: 'Team Manager',
                    email: 'manager@test.com',
                    role: 'manager',
                },
            },
        });

        const { result } = renderHook(() => useAuth(), {
            wrapper,
        });

        await act(async () => {
            await result.current.login({
                email: 'manager@test.com',
                password: 'password123',
            });
        });

        expect(getAuthenticatedUserMock).toHaveBeenCalledTimes(1);
        expect(result.current.user?.role).toBe('manager');
        expect(getAccessToken()).toBe('manager-jwt-token');
    });

    test('rejects login when Laravel does not return a token', async () => {
        loginUserMock.mockResolvedValue({
            data: {
                user: {
                    id: '44444444-4444-4444-8444-444444444444',
                    role: 'admin',
                },
            },
        });

        const { result } = renderHook(() => useAuth(), {
            wrapper,
        });

        await expect(
            act(async () => {
                await result.current.login({
                    email: 'admin@test.com',
                    password: 'password123',
                });
            }),
        ).rejects.toThrow('Laravel did not return an authentication token.');

        expect(getAccessToken()).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
    });

    test('logs out and clears the session', async () => {
        loginUserMock.mockResolvedValue({
            data: {
                user: {
                    id: '44444444-4444-4444-8444-444444444444',
                    name: 'System Admin',
                    role: 'admin',
                },
                access_token: 'admin-jwt-token',
            },
        });

        const { result } = renderHook(() => useAuth(), {
            wrapper,
        });

        await act(async () => {
            await result.current.login({
                email: 'admin@test.com',
                password: 'password123',
            });
        });

        await act(async () => {
            await result.current.logout();
        });

        expect(logoutUserMock).toHaveBeenCalledTimes(1);
        expect(getAccessToken()).toBeNull();
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
    });

    test('restores an existing authenticated session', async () => {
        setAccessToken('existing-jwt-token');

        getAuthenticatedUserMock.mockResolvedValue({
            data: {
                user: {
                    id: '33333333-3333-4333-8333-333333333333',
                    name: 'Team Member',
                    email: 'member@test.com',
                    role: 'team_member',
                },
            },
        });

        const { result } = renderHook(() => useAuth(), {
            wrapper,
        });

        expect(result.current.isInitializing).toBe(true);

        await waitFor(() => {
            expect(result.current.isInitializing).toBe(false);
        });

        expect(getAuthenticatedUserMock).toHaveBeenCalledTimes(1);
        expect(result.current.user?.id).toBe(
            '33333333-3333-4333-8333-333333333333',
        );
        expect(result.current.isAuthenticated).toBe(true);
        expect(getAccessToken()).toBe('existing-jwt-token');
    });

    test('clears an invalid stored session', async () => {
        setAccessToken('expired-jwt-token');

        getAuthenticatedUserMock.mockRejectedValue(
            new Error('Unauthenticated.'),
        );

        const { result } = renderHook(() => useAuth(), {
            wrapper,
        });

        await waitFor(() => {
            expect(result.current.isInitializing).toBe(false);
        });

        expect(getAccessToken()).toBeNull();
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
    });

    test('clears authentication when an unauthorized event is received', async () => {
        loginUserMock.mockResolvedValue({
            data: {
                user: {
                    id: '44444444-4444-4444-8444-444444444444',
                    name: 'System Admin',
                    role: 'admin',
                },
                access_token: 'admin-jwt-token',
            },
        });

        const { result } = renderHook(() => useAuth(), {
            wrapper,
        });

        await act(async () => {
            await result.current.login({
                email: 'admin@test.com',
                password: 'password123',
            });
        });

        act(() => {
            window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
        });

        expect(getAccessToken()).toBeNull();
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
    });

    test('clears the local session when the logout API fails', async () => {
        loginUserMock.mockResolvedValue({
            data: {
                user: {
                    id: '44444444-4444-4444-8444-444444444444',
                    name: 'System Admin',
                    role: 'admin',
                },
                access_token: 'admin-jwt-token',
            },
        });

        logoutUserMock.mockRejectedValue(
            new Error('Logout service unavailable.'),
        );

        const { result } = renderHook(() => useAuth(), {
            wrapper,
        });

        await act(async () => {
            await result.current.login({
                email: 'admin@test.com',
                password: 'password123',
            });
        });

        await act(async () => {
            await result.current.logout();
        });

        expect(logoutUserMock).toHaveBeenCalledTimes(1);
        expect(getAccessToken()).toBeNull();
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
    });

    test('updates the authenticated user in the current session', async () => {
        loginUserMock.mockResolvedValue({
            data: {
                user: {
                    id: '44444444-4444-4444-8444-444444444444',
                    name: 'System Admin',
                    role: 'admin',
                    email_notifications_enabled: true,
                },
                access_token: 'admin-jwt-token',
            },
        });

        const { result } = renderHook(() => useAuth(), {
            wrapper,
        });

        await act(async () => {
            await result.current.login({
                email: 'admin@test.com',
                password: 'password123',
            });
        });

        act(() => {
            result.current.updateCurrentUser({
                email_notifications_enabled: false,
            });
        });

        expect(result.current.user.email_notifications_enabled).toBe(false);

        expect(result.current.user.name).toBe('System Admin');
    });
});
