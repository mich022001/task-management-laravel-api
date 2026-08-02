import MockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import laravelClient from '../../api/laravelClient.js';
import {
    getAuthenticatedUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
} from '../auth.service.js';

describe('auth service', () => {
    let mock;

    beforeEach(() => {
        mock = new MockAdapter(laravelClient);
    });

    afterEach(() => {
        mock.restore();
    });

    test('logs in using the Laravel authentication endpoint', async () => {
        mock.onPost('/auth/login', {
            email: 'admin@test.com',
            password: 'password123',
        }).reply(200, {
            data: {
                access_token: 'login-token',
            },
        });

        const response = await loginUser({
            email: 'admin@test.com',
            password: 'password123',
        });

        expect(response.data.access_token).toBe('login-token');
    });

    test('retrieves the authenticated user', async () => {
        mock.onGet('/auth/me').reply(200, {
            data: {
                user: {
                    id: 1,
                    role: 'admin',
                },
            },
        });

        const response = await getAuthenticatedUser();

        expect(response.data.user).toEqual({
            id: 1,
            role: 'admin',
        });
    });

    test('logs out through Laravel', async () => {
        mock.onPost('/auth/logout').reply(200, {
            message: 'Logout successful.',
        });

        const response = await logoutUser();

        expect(response.message).toBe('Logout successful.');
    });

    test('refreshes the current access token', async () => {
        mock.onPost('/auth/refresh').reply(200, {
            data: {
                access_token: 'refreshed-token',
            },
        });

        const response = await refreshAccessToken();

        expect(response.data.access_token).toBe('refreshed-token');
    });
});
