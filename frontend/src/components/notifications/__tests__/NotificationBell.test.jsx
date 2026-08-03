import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import NotificationBell from '../NotificationBell.jsx';

const listNotificationsMock = vi.fn();
const markNotificationAsReadMock = vi.fn();
const clearNotificationsMock = vi.fn();

vi.mock('../../../services/notification.service.js', () => ({
    listNotifications: (...arguments_) => listNotificationsMock(...arguments_),
    markNotificationAsRead: (...arguments_) =>
        markNotificationAsReadMock(...arguments_),
    clearNotifications: (...arguments_) =>
        clearNotificationsMock(...arguments_),
}));

function createNotification(overrides = {}) {
    return {
        id: 'notification-uuid',
        type: 'task_assigned',
        title: 'New task assigned',
        message: 'Prepare the deployment report.',
        task_id: 'task-uuid',
        is_read: false,
        created_at: '2026-08-03T06:00:00.000Z',
        ...overrides,
    };
}

function renderBell() {
    return render(
        <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
                <Route path="/dashboard" element={<NotificationBell />} />
                <Route
                    path="/tasks/:taskId"
                    element={<p>Task details destination</p>}
                />
            </Routes>
        </MemoryRouter>,
    );
}

describe('NotificationBell', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        listNotificationsMock.mockResolvedValue({
            data: [createNotification()],
            meta: {
                unread_count: 1,
            },
        });

        markNotificationAsReadMock.mockResolvedValue({
            message: 'Notification marked as read.',
        });

        clearNotificationsMock.mockResolvedValue({
            message: 'Notifications cleared successfully.',
        });
    });

    test('loads and displays the unread count', async () => {
        renderBell();

        expect(
            await screen.findByRole('button', {
                name: 'Notifications, 1 unread',
            }),
        ).toBeInTheDocument();

        expect(listNotificationsMock).toHaveBeenCalledWith({
            per_page: 20,
        });
    });

    test('opens the notification list', async () => {
        const user = userEvent.setup();

        renderBell();

        await user.click(
            await screen.findByRole('button', {
                name: 'Notifications, 1 unread',
            }),
        );

        expect(
            screen.getByRole('dialog', {
                name: 'Notifications',
            }),
        ).toBeInTheDocument();

        expect(screen.getByText('New task assigned')).toBeInTheDocument();

        expect(
            screen.getByText('Prepare the deployment report.'),
        ).toBeInTheDocument();
    });

    test('marks a notification as read and opens the task', async () => {
        const user = userEvent.setup();

        renderBell();

        await user.click(
            await screen.findByRole('button', {
                name: 'Notifications, 1 unread',
            }),
        );

        await user.click(
            screen.getByRole('button', {
                name: /New task assigned/,
            }),
        );

        await waitFor(() => {
            expect(markNotificationAsReadMock).toHaveBeenCalledWith(
                'notification-uuid',
            );
        });

        expect(
            await screen.findByText('Task details destination'),
        ).toBeInTheDocument();
    });

    test('clears all notifications', async () => {
        const user = userEvent.setup();

        renderBell();

        await user.click(
            await screen.findByRole('button', {
                name: 'Notifications, 1 unread',
            }),
        );

        await user.click(
            screen.getByRole('button', {
                name: 'Clear all',
            }),
        );

        await waitFor(() => {
            expect(clearNotificationsMock).toHaveBeenCalledTimes(1);
        });

        expect(screen.getByText('You are all caught up')).toBeInTheDocument();
    });
});
