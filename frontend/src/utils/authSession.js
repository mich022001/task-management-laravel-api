const ACCESS_TOKEN_KEY = 'task_management_access_token';

export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';

export function getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token) {
    if (typeof token !== 'string' || token.trim() === '') {
        throw new TypeError('A valid access token is required.');
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function notifyUnauthorized() {
    window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
}
