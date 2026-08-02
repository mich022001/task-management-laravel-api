import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import EditTask from '../EditTask.jsx';

const navigateMock = vi.fn();
const getTaskMock = vi.fn();
const updateTaskMock = vi.fn();
const listTeamsMock = vi.fn();
const getTeamMock = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');

    return {
        ...actual,
        useNavigate: () => navigateMock,
        useParams: () => ({
            taskId: '1',
        }),
    };
});

vi.mock('../../services/task.service.js', () => ({
    getTask: (...arguments_) => getTaskMock(...arguments_),
    updateTask: (...arguments_) => updateTaskMock(...arguments_),
}));

vi.mock('../../services/team.service.js', () => ({
    listTeams: (...arguments_) => listTeamsMock(...arguments_),
    getTeam: (...arguments_) => getTeamMock(...arguments_),
}));

function renderPage() {
    return render(
        <MemoryRouter>
            <EditTask />
        </MemoryRouter>,
    );
}

describe('EditTask page', () => {
    beforeEach(() => {
        navigateMock.mockReset();
        getTaskMock.mockReset();
        updateTaskMock.mockReset();
        listTeamsMock.mockReset();
        getTeamMock.mockReset();
        sessionStorage.clear();

        getTaskMock.mockResolvedValue({
            data: {
                task: {
                    id: 1,
                    title: 'Setup database',
                    description: 'Configure PostgreSQL.',
                    priority: 'high',
                    team_id: 1,
                    assigned_to: 3,
                    due_date: '2026-08-10T00:00:00.000000Z',
                },
            },
        });

        listTeamsMock.mockResolvedValue({
            data: [
                {
                    id: 1,
                    name: 'Engineering',
                },
            ],
        });

        getTeamMock.mockResolvedValue({
            data: {
                team: {
                    id: 1,
                    members: [
                        {
                            id: 3,
                            name: 'Team Member',
                        },
                    ],
                },
            },
        });
    });

    test('loads an existing task into the form', async () => {
        renderPage();

        expect(screen.getByText('Loading task...')).toBeInTheDocument();

        expect(
            await screen.findByRole('heading', {
                name: 'Edit Task',
            }),
        ).toBeInTheDocument();

        expect(screen.getByLabelText(/Title/)).toHaveValue('Setup database');
        expect(screen.getByLabelText(/Description/)).toHaveValue(
            'Configure PostgreSQL.',
        );
        expect(screen.getByLabelText(/Priority/)).toHaveValue('high');
        expect(screen.getByLabelText(/Assigned Team/)).toHaveValue('1');
        expect(screen.getByLabelText(/Assignee/)).toHaveValue('3');
        expect(screen.getByLabelText(/Due Date/)).toHaveValue('2026-08-10');
    });

    test('saves task updates and redirects', async () => {
        const user = userEvent.setup();

        updateTaskMock.mockResolvedValue({
            message: 'Task updated successfully.',
            data: {
                task: {
                    id: 1,
                },
            },
        });

        renderPage();

        await screen.findByRole('heading', {
            name: 'Edit Task',
        });

        const titleInput = await screen.findByLabelText(/Title/);

        await user.clear(titleInput);
        await user.type(titleInput, 'Updated database setup');

        await user.click(
            await screen.findByRole('button', {
                name: 'Save Changes',
            }),
        );

        await waitFor(() => {
            expect(updateTaskMock).toHaveBeenCalledWith('1', {
                title: 'Updated database setup',
                description: 'Configure PostgreSQL.',
                priority: 'high',
                team_id: 1,
                assigned_to: 3,
                due_date: '2026-08-10',
            });
        });

        expect(sessionStorage.getItem('task_success_message')).toBe(
            'Task updated successfully.',
        );

        expect(navigateMock).toHaveBeenCalledWith('/tasks', {
            replace: true,
        });
    });

    test('shows Laravel validation errors', async () => {
        const user = userEvent.setup();

        updateTaskMock.mockRejectedValue({
            response: {
                data: {
                    message: 'The given data was invalid.',
                    errors: {
                        title: ['The title field is invalid.'],
                    },
                },
            },
        });

        renderPage();

        await screen.findByRole('heading', {
            name: 'Edit Task',
        });

        await user.click(
            await screen.findByRole('button', {
                name: 'Save Changes',
            }),
        );

        expect(
            await screen.findByText('The title field is invalid.'),
        ).toBeInTheDocument();
    });
});
