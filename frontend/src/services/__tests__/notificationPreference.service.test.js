import { beforeEach, describe, expect, test, vi } from 'vitest';

import laravelClient from '../../api/laravelClient.js';
import {
    getNotificationPreferences,
    updateNotificationPreferences,
} from '../notificationPreference.service.js';

vi.mock('../../api/laravelClient.js', () => ({
    default: {
        get: vi.fn(),
        patch: vi.fn(),
    },
}));

describe('notification preference service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('retrieves notification preferences', async () => {
        const payload = {
            message: 'Notification preferences retrieved successfully.',
            data: {
                email_notifications_enabled: true,
            },
        };

        laravelClient.get.mockResolvedValue({
            data: payload,
        });

        const response = await getNotificationPreferences();

        expect(laravelClient.get).toHaveBeenCalledWith(
            '/settings/notifications',
        );

        expect(response).toEqual(payload);
    });

    test('updates notification preferences', async () => {
        const payload = {
            message: 'Notification preferences updated successfully.',
            data: {
                email_notifications_enabled: false,
            },
        };

        laravelClient.patch.mockResolvedValue({
            data: payload,
        });

        const response = await updateNotificationPreferences(false);

        expect(laravelClient.patch).toHaveBeenCalledWith(
            '/settings/notifications',
            {
                email_notifications_enabled: false,
            },
        );

        expect(response).toEqual(payload);
    });
});
