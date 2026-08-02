import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import CreateTask from '../CreateTask.jsx';

const navigateMock = vi.fn();
const listTeamsMock = vi.fn();
const getTeamMock = vi.fn();
const createTaskMock = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');

    return {
        ...actual,
        useNavigate: () => navigateMock,
    };
});

vi.mock('../../services/team.service.js', () => ({
    listTeams: (...arguments_) => listTeamsMock(...arguments_),
    getTeam: (...arguments_) => getTeamMock(...arguments_),
}));

vi.mock('../../services/task.service.js', () => ({
    createTask: (...arguments_) => createTaskMock(...arguments_),
}));

function renderPage() {
    return render(
        <MemoryRouter>
            <CreateTask />
        </MemoryRouter>,
    );
}

describe('CreateTask page', () => {
    beforeEach(() => {
        navigateMock.mockReset();
        listTeamsMock.mockReset();
        getTeamMock.mockReset();
        createTaskMock.mockReset();
        sessionStorage.clear();

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
                    members: [],
                },
            },
        });
    });

    test('loads teams and creates a task', async () => {
        const user = userEvent.setup();

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

        createTaskMock.mockResolvedValue({
            message: 'Task created successfully.',
            data: {
                task: {
                    id: 10,
                },
            },
        });

        renderPage();

        expect(screen.getByText('Loading task form...')).toBeInTheDocument();

        expect(
            await screen.findByRole('heading', {
                name: 'Create Task',
            }),
        ).toBeInTheDocument();

        await user.type(screen.getByLabelText(/Title/), 'Build task workflow');

        await user.selectOptions(screen.getByLabelText(/Priority/), 'high');

        await user.selectOptions(screen.getByLabelText(/Assigned Team/), '1');

        expect(getTeamMock).toHaveBeenCalledWith('1');

        await screen.findByRole('option', {
            name: 'Team Member',
        });

        await user.selectOptions(screen.getByLabelText(/Assignee/), '3');

        await user.type(screen.getByLabelText(/Due Date/), '2026-08-10');

        await user.click(
            await screen.findByRole('button', {
                name: 'Create Task',
            }),
        );

        await waitFor(() => {
            expect(createTaskMock).toHaveBeenCalledWith({
                title: 'Build task workflow',
                description: null,
                priority: 'high',
                team_id: 1,
                assigned_to: 3,
                due_date: '2026-08-10',
            });
        });

        expect(sessionStorage.getItem('task_success_message')).toBe(
            'Task created successfully.',
        );

        expect(navigateMock).toHaveBeenCalledWith('/tasks', {
            replace: true,
        });
    });

    test('shows client-side required-field errors', async () => {
        const user = userEvent.setup();

        renderPage();

        await screen.findByRole('heading', {
            name: 'Create Task',
        });

        await user.click(
            await screen.findByRole('button', {
                name: 'Create Task',
            }),
        );

        expect(
            screen.getByText('The title field is required.'),
        ).toBeInTheDocument();

        expect(
            screen.getByText('The priority field is required.'),
        ).toBeInTheDocument();

        expect(
            screen.getByText('The assigned team field is required.'),
        ).toBeInTheDocument();

        expect(createTaskMock).not.toHaveBeenCalled();
    });

    test('shows Laravel validation errors', async () => {
        const user = userEvent.setup();

        createTaskMock.mockRejectedValue({
            response: {
                data: {
                    message: 'The given data was invalid.',
                    errors: {
                        title: ['The title has already been taken.'],
                    },
                },
            },
        });

        renderPage();

        await screen.findByRole('heading', {
            name: 'Create Task',
        });

        await user.type(screen.getByLabelText(/Title/), 'Existing task');
        await user.selectOptions(screen.getByLabelText(/Priority/), 'medium');
        await user.selectOptions(screen.getByLabelText(/Assigned Team/), '1');

        await user.click(
            screen.getByRole('button', {
                name: 'Create Task',
            }),
        );

        expect(
            await screen.findByText('The title has already been taken.'),
        ).toBeInTheDocument();
    });
});
