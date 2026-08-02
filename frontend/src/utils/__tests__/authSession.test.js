import { describe, expect, test, vi } from 'vitest';

import {
    AUTH_UNAUTHORIZED_EVENT,
    clearAccessToken,
    getAccessToken,
    notifyUnauthorized,
    setAccessToken,
} from '../authSession.js';

describe('Authentication session utility', () => {
    test('stores and retrieves the access token', () => {
        setAccessToken('valid-jwt-token');

        expect(getAccessToken()).toBe('valid-jwt-token');
    });

    test('clears the access token', () => {
        setAccessToken('valid-jwt-token');

        clearAccessToken();

        expect(getAccessToken()).toBeNull();
    });

    test('rejects an empty access token', () => {
        expect(() => setAccessToken('')).toThrow(
            'A valid access token is required.',
        );
    });

    test('rejects a non-string access token', () => {
        expect(() => setAccessToken(null)).toThrow(TypeError);
    });

    test('dispatches the unauthorized event', () => {
        const listener = vi.fn();

        window.addEventListener(AUTH_UNAUTHORIZED_EVENT, listener);

        notifyUnauthorized();

        expect(listener).toHaveBeenCalledTimes(1);

        window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, listener);
    });
});
