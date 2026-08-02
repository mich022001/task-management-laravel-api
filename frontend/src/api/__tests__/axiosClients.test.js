import AxiosMockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { laravelClient } from '../laravelClient.js';
import { nodeClient } from '../nodeClient.js';
import {
    AUTH_UNAUTHORIZED_EVENT,
    getAccessToken,
    setAccessToken,
} from '../../utils/authSession.js';

describe.each([
    ['Laravel client', laravelClient],
    ['Node client', nodeClient],
])('%s', (_name, client) => {
    let mock;

    beforeEach(() => {
        mock = new AxiosMockAdapter(client);
    });

    afterEach(() => {
        mock.restore();
    });

    test('adds the bearer token to authenticated requests', async () => {
        setAccessToken('frontend-test-token');

        mock.onGet('/resource').reply((config) => {
            expect(config.headers.Authorization).toBe(
                'Bearer frontend-test-token',
            );

            return [200, { ok: true }];
        });

        const response = await client.get('/resource');

        expect(response.data).toEqual({
            ok: true,
        });
    });

    test('does not add authorization when no token exists', async () => {
        mock.onGet('/resource').reply((config) => {
            expect(config.headers.Authorization).toBeUndefined();

            return [200, { ok: true }];
        });

        const response = await client.get('/resource');

        expect(response.status).toBe(200);
    });

    test('clears the token and emits unauthorized on 401', async () => {
        setAccessToken('expired-token');

        const unauthorizedListener = vi.fn();

        window.addEventListener(AUTH_UNAUTHORIZED_EVENT, unauthorizedListener);

        mock.onGet('/protected').reply(401, {
            message: 'Unauthenticated.',
        });

        await expect(client.get('/protected')).rejects.toMatchObject({
            response: {
                status: 401,
            },
        });

        expect(getAccessToken()).toBeNull();
        expect(unauthorizedListener).toHaveBeenCalledTimes(1);

        window.removeEventListener(
            AUTH_UNAUTHORIZED_EVENT,
            unauthorizedListener,
        );
    });

    test('does not clear the token for non-401 failures', async () => {
        setAccessToken('still-valid-token');

        mock.onGet('/forbidden').reply(403, {
            message: 'Forbidden.',
        });

        await expect(client.get('/forbidden')).rejects.toMatchObject({
            response: {
                status: 403,
            },
        });

        expect(getAccessToken()).toBe('still-valid-token');
    });
});
