import laravelClient from '../api/laravelClient.js';

export async function listUsers(parameters = {}) {
    const response = await laravelClient.get('/users', {
        params: parameters,
    });

    return response.data;
}

export async function getUser(userId) {
    const response = await laravelClient.get(`/users/${userId}`);

    return response.data;
}

export async function createUser(credentials) {
    const response = await laravelClient.post('/users', credentials);

    return response.data;
}

export async function updateUser(userId, credentials) {
    const response = await laravelClient.patch(`/users/${userId}`, credentials);

    return response.data;
}

export async function updateUserStatus(userId, isActive) {
    const response = await laravelClient.patch(`/users/${userId}/status`, {
        is_active: isActive,
    });

    return response.data;
}
