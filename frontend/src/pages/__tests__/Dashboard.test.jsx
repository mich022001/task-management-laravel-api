import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AuthContext } from '../../context/auth-context.js';
import Dashboard from '../Dashboard.jsx';

const getTaskSummaryMock = vi.fn();
const downloadTasksMock = vi.fn();
const getExportOptionsMock = vi.fn();

vi.mock('../../services/analytics.service.js', () => ({
    getTaskSummary: (...arguments_) => getTaskSummaryMock(...arguments_),
}));

vi.mock('../../services/export.service.js', () => ({
    downloadTasks: (...arguments_) => downloadTasksMock(...arguments_),
    getExportOptions: (...arguments_) => getExportOptionsMock(...arguments_),
}));

function createSummary(overrides = {}) {
    return {
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
        ...overrides,
    };
}

function renderDashboard(role = 'admin') {
    return render(
        <AuthContext.Provider
            value={{
                user: {
                    id: 'user-1',
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
        vi.clearAllMocks();

        getTaskSummaryMock.mockResolvedValue({
            data: createSummary(),
        });

        getExportOptionsMock.mockResolvedValue({
            data: {
                scope: 'all',
                teams: [
                    {
                        id: '11111111-1111-4111-8111-111111111111',
                        name: 'Engineering',
                    },
                ],
                users: [
                    {
                        id: '33333333-3333-4333-8333-333333333333',
                        name: 'Michael Developer',
                        email: 'michael@example.com',
                        role: 'team_member',
                    },
                ],
            },
        });

        downloadTasksMock.mockResolvedValue({
            blob: new Blob(['task export']),
            contentDisposition: 'attachment; filename="tasks-2026-08-04.csv"',
        });

        Object.defineProperty(URL, 'createObjectURL', {
            writable: true,
            value: vi.fn(() => 'blob:task-export'),
        });

        Object.defineProperty(URL, 'revokeObjectURL', {
            writable: true,
            value: vi.fn(),
        });

        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
            () => {},
        );
    });

    test('loads and displays analytics for an admin', async () => {
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
                data: createSummary({
                    total_tasks: 1,
                }),
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

    test('allows a team member to open a self-scoped export', async () => {
        const user = userEvent.setup();

        getExportOptionsMock.mockResolvedValueOnce({
            data: {
                scope: 'self',
                teams: [],
                users: [
                    {
                        id: '33333333-3333-4333-8333-333333333333',
                        name: 'Michael Developer',
                        email: 'michael@example.com',
                        role: 'team_member',
                    },
                ],
            },
        });

        renderDashboard('team_member');

        await user.click(
            await screen.findByRole('button', {
                name: 'Export Tasks',
            }),
        );

        expect(
            await screen.findByRole('dialog', {
                name: 'Export Tasks',
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByText('Report scope: My tasks only'),
        ).toBeInTheDocument();

        expect(screen.queryByLabelText('Team')).not.toBeInTheDocument();
        expect(
            screen.queryByLabelText('Assigned user'),
        ).not.toBeInTheDocument();

        expect(getExportOptionsMock).toHaveBeenCalledTimes(1);
    });

    test('opens the task export modal for an admin', async () => {
        const user = userEvent.setup();

        renderDashboard('admin');

        await user.click(
            await screen.findByRole('button', {
                name: 'Export Tasks',
            }),
        );

        expect(
            await screen.findByRole('dialog', {
                name: 'Export Tasks',
            }),
        ).toBeInTheDocument();

        expect(getExportOptionsMock).toHaveBeenCalledTimes(1);

        expect(screen.getByLabelText('Team')).toBeInTheDocument();
        expect(screen.getByLabelText('Assigned user')).toBeInTheDocument();
        expect(screen.getByText('File to download')).toBeInTheDocument();
    });

    test('submits filters and downloads a CSV export', async () => {
        const user = userEvent.setup();

        renderDashboard('admin');

        await user.click(
            await screen.findByRole('button', {
                name: 'Export Tasks',
            }),
        );

        await screen.findByRole('dialog', {
            name: 'Export Tasks',
        });

        await user.selectOptions(
            screen.getByLabelText('Team'),
            '11111111-1111-4111-8111-111111111111',
        );

        await user.selectOptions(screen.getByLabelText('Status'), 'completed');

        await user.selectOptions(screen.getByLabelText('Priority'), 'high');

        await user.selectOptions(
            screen.getByLabelText('Assigned user'),
            '33333333-3333-4333-8333-333333333333',
        );

        await user.type(screen.getByLabelText('Date from'), '2026-08-01');

        await user.type(screen.getByLabelText('Date to'), '2026-08-31');

        await user.click(
            screen.getByRole('button', {
                name: 'Download Export',
            }),
        );

        await waitFor(() => {
            expect(downloadTasksMock).toHaveBeenCalledWith({
                format: 'csv',
                team_id: '11111111-1111-4111-8111-111111111111',
                filters: {
                    status: 'completed',
                    priority: 'high',
                    assigned_to: '33333333-3333-4333-8333-333333333333',
                    date_from: '2026-08-01',
                    date_to: '2026-08-31',
                },
            });
        });

        expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:task-export');
    });

    test('shows an export API failure inside the modal', async () => {
        const user = userEvent.setup();

        downloadTasksMock.mockRejectedValueOnce({
            response: {
                data: {
                    message: 'Export service unavailable.',
                },
            },
        });

        renderDashboard('manager');

        await user.click(
            await screen.findByRole('button', {
                name: 'Export Tasks',
            }),
        );

        await user.click(
            await screen.findByRole('button', {
                name: 'Download Export',
            }),
        );

        expect(
            await screen.findByText('Export service unavailable.'),
        ).toBeInTheDocument();

        expect(
            screen.getByRole('dialog', {
                name: 'Export Tasks',
            }),
        ).toBeInTheDocument();
    });
});
