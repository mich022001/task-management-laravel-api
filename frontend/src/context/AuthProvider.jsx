import { useCallback, useEffect, useMemo, useState } from 'react';

import {
    getAuthenticatedUser,
    loginUser,
    logoutUser,
} from '../services/auth.service.js';
import {
    AUTH_UNAUTHORIZED_EVENT,
    clearAccessToken,
    getAccessToken,
    setAccessToken,
} from '../utils/authSession.js';
import { AuthContext } from './auth-context.js';

function extractAccessToken(payload) {
    return payload?.data?.access_token ?? payload?.access_token ?? null;
}

function extractUser(payload) {
    return payload?.data?.user ?? payload?.user ?? payload?.data ?? null;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    const [isInitializing, setIsInitializing] = useState(() =>
        Boolean(getAccessToken()),
    );

    useEffect(() => {
        const accessToken = getAccessToken();

        if (!accessToken) {
            return undefined;
        }

        let isActive = true;

        async function initializeSession() {
            try {
                const response = await getAuthenticatedUser();
                const authenticatedUser = extractUser(response);

                if (!authenticatedUser?.id) {
                    throw new Error(
                        'Laravel returned an invalid authenticated user response.',
                    );
                }

                if (isActive) {
                    setUser(authenticatedUser);
                }
            } catch {
                clearAccessToken();

                if (isActive) {
                    setUser(null);
                }
            } finally {
                if (isActive) {
                    setIsInitializing(false);
                }
            }
        }

        void initializeSession();

        return () => {
            isActive = false;
        };
    }, []);

    useEffect(() => {
        function handleUnauthorized() {
            clearAccessToken();
            setUser(null);
            setIsInitializing(false);
        }

        window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);

        return () => {
            window.removeEventListener(
                AUTH_UNAUTHORIZED_EVENT,
                handleUnauthorized,
            );
        };
    }, []);

    const login = useCallback(async (credentials) => {
        const response = await loginUser(credentials);
        const accessToken = extractAccessToken(response);

        if (!accessToken) {
            throw new Error('Laravel did not return an authentication token.');
        }

        setAccessToken(accessToken);

        let authenticatedUser = extractUser(response);

        if (!authenticatedUser?.id) {
            const userResponse = await getAuthenticatedUser();
            authenticatedUser = extractUser(userResponse);
        }

        if (!authenticatedUser?.id) {
            clearAccessToken();

            throw new Error(
                'Laravel did not return authenticated user information.',
            );
        }

        setUser(authenticatedUser);
        setIsInitializing(false);

        return authenticatedUser;
    }, []);

    const updateCurrentUser = useCallback((changes) => {
        setUser((currentUser) => {
            if (!currentUser) {
                return currentUser;
            }

            return {
                ...currentUser,
                ...changes,
            };
        });
    }, []);

    const logout = useCallback(async () => {
        try {
            if (getAccessToken()) {
                await logoutUser();
            }
        } catch {
            // Local authentication must still be cleared when the
            // token is already expired, invalid, or the API is unavailable.
        } finally {
            clearAccessToken();
            setUser(null);
            setIsInitializing(false);
        }
    }, []);

    const value = useMemo(
        () => ({
            user,
            isAuthenticated: Boolean(user),
            isInitializing,
            login,
            logout,
            updateCurrentUser,
        }),
        [user, isInitializing, login, logout, updateCurrentUser],
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}
