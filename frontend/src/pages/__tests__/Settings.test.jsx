import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AuthContext } from '../../context/auth-context.js';
import Settings from '../Settings.jsx';

const getNotificationPreferencesMock = vi.fn();
const updateNotificationPreferencesMock = vi.fn();
const updateCurrentUserMock = vi.fn();

vi.mock('../../services/notificationPreference.service.js', () => ({
    getNotificationPreferences: (...arguments_) =>
        getNotificationPreferencesMock(...arguments_),

    updateNotificationPreferences: (...arguments_) =>
        updateNotificationPreferencesMock(...arguments_),
}));

function renderSettings() {
    return render(
        <AuthContext.Provider
            value={{
                user: {
                    id: '33333333-3333-4333-8333-333333333333',
                    name: 'Team Member',
                    role: 'team_member',
                    email_notifications_enabled: true,
                },
                isAuthenticated: true,
                isInitializing: false,
                login: vi.fn(),
                logout: vi.fn(),
                updateCurrentUser: updateCurrentUserMock,
            }}
        >
            <Settings />
        </AuthContext.Provider>,
    );
}

describe('Settings page', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        getNotificationPreferencesMock.mockResolvedValue({
            data: {
                email_notifications_enabled: true,
            },
        });

        updateNotificationPreferencesMock.mockResolvedValue({
            data: {
                email_notifications_enabled: false,
            },
        });
    });

    test('loads the current email notification preference', async () => {
        renderSettings();

        expect(
            screen.getByText('Loading notification preferences...'),
        ).toBeInTheDocument();

        const checkbox = await screen.findByRole('checkbox', {
            name: 'Enable email notifications',
        });

        expect(checkbox).toBeChecked();

        expect(getNotificationPreferencesMock).toHaveBeenCalledTimes(1);
    });

    test('disables and saves email notifications', async () => {
        const user = userEvent.setup();

        renderSettings();

        const checkbox = await screen.findByRole('checkbox', {
            name: 'Enable email notifications',
        });

        await user.click(checkbox);

        expect(checkbox).not.toBeChecked();

        await user.click(
            screen.getByRole('button', {
                name: 'Save preferences',
            }),
        );

        await waitFor(() => {
            expect(updateNotificationPreferencesMock).toHaveBeenCalledWith(
                false,
            );
        });

        expect(updateCurrentUserMock).toHaveBeenCalledWith({
            email_notifications_enabled: false,
        });

        expect(
            screen.getByText('Notification preferences updated successfully.'),
        ).toBeInTheDocument();
    });

    test('displays an API loading error', async () => {
        getNotificationPreferencesMock.mockRejectedValue({
            response: {
                data: {
                    message: 'Preference service unavailable.',
                },
            },
        });

        renderSettings();

        expect(
            await screen.findByText('Preference service unavailable.'),
        ).toBeInTheDocument();
    });
});
