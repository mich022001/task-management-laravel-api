import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AuthContext } from '../../context/auth-context.js';
import Tasks from '../Tasks.jsx';

const listTasksMock = vi.fn();
const listTeamsMock = vi.fn();

vi.mock('../../services/task.service.js', () => ({
    listTasks: (...arguments_) => listTasksMock(...arguments_),
}));

vi.mock('../../services/team.service.js', () => ({
    listTeams: (...arguments_) => listTeamsMock(...arguments_),
}));

function renderTasks(role = 'admin') {
    return render(
        <MemoryRouter>
            <AuthContext.Provider
                value={{
                    user: {
                        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                        name: 'Test User',
                        role,
                    },
                    isAuthenticated: true,
                    isInitializing: false,
                    login: vi.fn(),
                    logout: vi.fn(),
                }}
            >
                <Tasks />
            </AuthContext.Provider>
        </MemoryRouter>,
    );
}

function buildTaskResponse(tasks = []) {
    return {
        data: tasks,
        meta: {
            current_page: 1,
            per_page: 10,
            total: tasks.length,
            last_page: 1,
        },
    };
}

function buildPendingTask(overrides = {}) {
    return {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        title: 'Build task UI',
        description: 'Create the task interface.',
        status: 'pending',
        allowed_transitions: ['in_progress', 'cancelled'],
        priority: 'high',
        team: {
            name: 'Engineering',
        },
        assignee: {
            name: 'Team Member',
        },
        due_date: null,
        ...overrides,
    };
}

describe('Tasks page', () => {
    beforeEach(() => {
        listTasksMock.mockReset();
        listTeamsMock.mockReset();
        sessionStorage.clear();

        listTeamsMock.mockResolvedValue({
            data: [
                {
                    id: '11111111-1111-4111-8111-111111111111',
                    name: 'Engineering',
                },
            ],
        });
    });

    test('loads and displays tasks', async () => {
        listTasksMock.mockResolvedValue(
            buildTaskResponse([buildPendingTask()]),
        );

        renderTasks();

        expect(screen.getByText('Loading tasks...')).toBeInTheDocument();

        expect(await screen.findByText('Build task UI')).toBeInTheDocument();

        expect(
            screen.getByRole('link', {
                name: 'Details',
            }),
        ).toHaveAttribute(
            'href',
            '/tasks/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        );

        expect(
            screen.getByRole('link', {
                name: 'Edit',
            }),
        ).toHaveAttribute(
            'href',
            '/tasks/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/edit',
        );

        expect(listTasksMock).toHaveBeenCalledWith({
            page: 1,
            per_page: 10,
            search: '',
            status: '',
            priority: '',
            team_id: '',
        });

        expect(listTeamsMock).toHaveBeenCalledWith({
            per_page: 100,
        });
    });

    test('applies selected filters', async () => {
        const user = userEvent.setup();

        listTasksMock.mockResolvedValue(buildTaskResponse());

        renderTasks();

        await screen.findByText('No tasks found');

        await user.type(screen.getByLabelText('Search'), 'dashboard');

        await user.selectOptions(
            screen.getByLabelText('Status'),
            'in_progress',
        );

        await user.selectOptions(screen.getByLabelText('Priority'), 'high');

        await user.selectOptions(
            screen.getByLabelText('Team'),
            '11111111-1111-4111-8111-111111111111',
        );

        await user.click(
            screen.getByRole('button', {
                name: 'Apply Filters',
            }),
        );

        await waitFor(() => {
            expect(listTasksMock).toHaveBeenLastCalledWith({
                page: 1,
                per_page: 10,
                search: 'dashboard',
                status: 'in_progress',
                priority: 'high',
                team_id: '11111111-1111-4111-8111-111111111111',
            });
        });
    });

    test('resets applied filters', async () => {
        const user = userEvent.setup();

        listTasksMock.mockResolvedValue(buildTaskResponse());

        renderTasks();

        await screen.findByText('No tasks found');

        await user.type(screen.getByLabelText('Search'), 'dashboard');

        await user.click(
            screen.getByRole('button', {
                name: 'Apply Filters',
            }),
        );

        await user.click(
            screen.getByRole('button', {
                name: 'Reset',
            }),
        );

        await waitFor(() => {
            expect(listTasksMock).toHaveBeenLastCalledWith({
                page: 1,
                per_page: 10,
                search: '',
                status: '',
                priority: '',
                team_id: '',
            });
        });

        expect(screen.getByLabelText('Search')).toHaveValue('');
    });

    test('hides the team filter for a team member', async () => {
        listTasksMock.mockResolvedValue(buildTaskResponse());

        renderTasks('team_member');

        await screen.findByText('No tasks found');

        expect(screen.queryByLabelText('Team')).not.toBeInTheDocument();

        expect(listTeamsMock).not.toHaveBeenCalled();
    });

    test('displays an empty state', async () => {
        listTasksMock.mockResolvedValue(buildTaskResponse());

        renderTasks();

        expect(await screen.findByText('No tasks found')).toBeInTheDocument();
    });

    test('displays and retries an API error', async () => {
        const user = userEvent.setup();

        listTasksMock
            .mockRejectedValueOnce({
                response: {
                    data: {
                        message: 'Task service unavailable.',
                    },
                },
            })
            .mockResolvedValueOnce(buildTaskResponse());

        renderTasks();

        expect(
            await screen.findByText(/Task service unavailable\./),
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        );

        expect(await screen.findByText('No tasks found')).toBeInTheDocument();

        expect(listTasksMock).toHaveBeenCalledTimes(2);
    });
});
