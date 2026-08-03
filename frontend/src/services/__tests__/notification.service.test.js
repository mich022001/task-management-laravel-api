import { beforeEach, describe, expect, test, vi } from 'vitest';

import laravelClient from '../../api/laravelClient.js';
import {
    clearNotifications,
    getUnreadNotificationCount,
    listNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    removeNotification,
} from '../notification.service.js';

vi.mock('../../api/laravelClient.js', () => ({
    default: {
        get: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('notification service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('lists notifications with query parameters', async () => {
        const parameters = {
            include_read: true,
            page: 2,
            per_page: 20,
        };

        const payload = {
            message: 'Notifications retrieved successfully.',
            data: [
                {
                    id: 'notification-uuid',
                    title: 'New task assigned',
                    is_read: false,
                },
            ],
            meta: {
                current_page: 2,
                last_page: 2,
                total: 21,
                unread_count: 1,
            },
        };

        laravelClient.get.mockResolvedValue({
            data: payload,
        });

        const response = await listNotifications(parameters);

        expect(laravelClient.get).toHaveBeenCalledWith('/notifications', {
            params: parameters,
        });

        expect(response).toEqual(payload);
    });

    test('retrieves unread notification count', async () => {
        const payload = {
            message: 'Unread notification count retrieved successfully.',
            data: {
                unread_count: 4,
            },
        };

        laravelClient.get.mockResolvedValue({
            data: payload,
        });

        const response = await getUnreadNotificationCount();

        expect(laravelClient.get).toHaveBeenCalledWith(
            '/notifications/unread-count',
        );

        expect(response).toEqual(payload);
    });

    test('marks one notification as read', async () => {
        const payload = {
            message: 'Notification marked as read.',
            data: {
                notification: {
                    id: 'notification-uuid',
                    is_read: true,
                },
            },
        };

        laravelClient.patch.mockResolvedValue({
            data: payload,
        });

        const response = await markNotificationAsRead('notification-uuid');

        expect(laravelClient.patch).toHaveBeenCalledWith(
            '/notifications/notification-uuid/read',
        );

        expect(response).toEqual(payload);
    });

    test('marks all notifications as read', async () => {
        const payload = {
            message: 'All notifications marked as read.',
            data: {
                updated_count: 3,
            },
        };

        laravelClient.patch.mockResolvedValue({
            data: payload,
        });

        const response = await markAllNotificationsAsRead();

        expect(laravelClient.patch).toHaveBeenCalledWith(
            '/notifications/read-all',
        );

        expect(response).toEqual(payload);
    });

    test('removes one notification', async () => {
        const payload = {
            message: 'Notification removed successfully.',
        };

        laravelClient.delete.mockResolvedValue({
            data: payload,
        });

        const response = await removeNotification('notification-uuid');

        expect(laravelClient.delete).toHaveBeenCalledWith(
            '/notifications/notification-uuid',
        );

        expect(response).toEqual(payload);
    });

    test('clears all notifications', async () => {
        const payload = {
            message: 'Notifications cleared successfully.',
            data: {
                deleted_count: 5,
            },
        };

        laravelClient.delete.mockResolvedValue({
            data: payload,
        });

        const response = await clearNotifications();

        expect(laravelClient.delete).toHaveBeenCalledWith('/notifications');

        expect(response).toEqual(payload);
    });
});
