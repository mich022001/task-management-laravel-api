import laravelClient from '../api/laravelClient.js';

export async function getNotificationPreferences() {
    const response = await laravelClient.get('/settings/notifications');

    return response.data;
}

export async function updateNotificationPreferences(emailNotificationsEnabled) {
    const response = await laravelClient.patch('/settings/notifications', {
        email_notifications_enabled: emailNotificationsEnabled,
    });

    return response.data;
}
