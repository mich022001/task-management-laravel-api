import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AuthContext } from '../../context/auth-context.js';
import Dashboard from '../Dashboard.jsx';

const getTaskSummaryMock = vi.fn();

vi.mock('../../services/analytics.service.js', () => ({
    getTaskSummary: (...arguments_) => getTaskSummaryMock(...arguments_),
}));

function renderDashboard(role = 'admin') {
    return render(
        <AuthContext.Provider
            value={{
                user: {
                    id: 1,
                    name: 'Test User',
                    role,
                },
                isAuthenticated: true,
                isInitializing: false,
                login: vi.fn(),
                logout: vi.fn(),
            }}
        >
            <Dashboard />
        </AuthContext.Provider>,
    );
}

describe('Dashboard page', () => {
    beforeEach(() => {
        getTaskSummaryMock.mockReset();
    });

    test('loads and displays analytics for an admin', async () => {
        getTaskSummaryMock.mockResolvedValue({
            data: {
                total_tasks: 8,
                status: {
                    pending: 2,
                    in_progress: 3,
                    completed: 3,
                    cancelled: 0,
                },
                completed_tasks: 3,
                overdue_tasks: 1,
                completion_rate: 37.5,
            },
        });

        renderDashboard('admin');

        expect(
            screen.getByText('Loading dashboard analytics...'),
        ).toBeInTheDocument();

        expect(await screen.findByText('Total Tasks')).toBeInTheDocument();

        expect(screen.getByText('8')).toBeInTheDocument();
        expect(getTaskSummaryMock).toHaveBeenCalledTimes(1);
    });

    test('displays an analytics API error', async () => {
        getTaskSummaryMock.mockRejectedValue({
            response: {
                data: {
                    message: 'Analytics service unavailable.',
                },
            },
        });

        renderDashboard('manager');

        expect(
            await screen.findByText('Analytics service unavailable.'),
        ).toBeInTheDocument();
    });

    test('retries after an analytics failure', async () => {
        const user = userEvent.setup();

        getTaskSummaryMock
            .mockRejectedValueOnce(new Error('Unavailable'))
            .mockResolvedValueOnce({
                data: {
                    total_tasks: 1,
                    status: {
                        pending: 1,
                    },
                    completed_tasks: 0,
                    overdue_tasks: 0,
                    completion_rate: 0,
                },
            });

        renderDashboard('admin');

        const retryButton = await screen.findByRole('button', {
            name: 'Retry',
        });

        await user.click(retryButton);

        await waitFor(() => {
            expect(getTaskSummaryMock).toHaveBeenCalledTimes(2);
        });

        expect(await screen.findByText('Total Tasks')).toBeInTheDocument();
    });

    test('does not request restricted analytics for a team member', () => {
        renderDashboard('team_member');

        expect(screen.getByText('Your assigned tasks')).toBeInTheDocument();

        expect(getTaskSummaryMock).not.toHaveBeenCalled();
    });
});
