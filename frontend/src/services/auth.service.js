import laravelClient from '../api/laravelClient.js';

export async function loginUser(credentials) {
    const response = await laravelClient.post('/auth/login', credentials);

    return response.data;
}

export async function getAuthenticatedUser() {
    const response = await laravelClient.get('/auth/me');

    return response.data;
}

export async function logoutUser() {
    const response = await laravelClient.post('/auth/logout');

    return response.data;
}

export async function refreshAccessToken() {
    const response = await laravelClient.post('/auth/refresh');

    return response.data;
}
