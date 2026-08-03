import laravelClient from '../api/laravelClient.js';

export async function listNotifications(parameters = {}) {
    const response = await laravelClient.get('/notifications', {
        params: parameters,
    });

    return response.data;
}

export async function getUnreadNotificationCount() {
    const response = await laravelClient.get('/notifications/unread-count');

    return response.data;
}

export async function markNotificationAsRead(notificationId) {
    const response = await laravelClient.patch(
        `/notifications/${notificationId}/read`,
    );

    return response.data;
}

export async function markAllNotificationsAsRead() {
    const response = await laravelClient.patch('/notifications/read-all');

    return response.data;
}

export async function removeNotification(notificationId) {
    const response = await laravelClient.delete(
        `/notifications/${notificationId}`,
    );

    return response.data;
}

export async function clearNotifications() {
    const response = await laravelClient.delete('/notifications');

    return response.data;
}
