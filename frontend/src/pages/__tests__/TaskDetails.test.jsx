import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AuthContext } from '../../context/auth-context.js';
import TaskDetails from '../TaskDetails.jsx';

const getTaskMock = vi.fn();
const listTaskCommentsMock = vi.fn();
const createTaskCommentMock = vi.fn();
const getTaskActivityMock = vi.fn();
const updateTaskStatusMock = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');

    return {
        ...actual,
        useParams: () => ({
            taskId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        }),
    };
});

vi.mock('../../services/task.service.js', () => ({
    getTask: (...arguments_) => getTaskMock(...arguments_),
    listTaskComments: (...arguments_) => listTaskCommentsMock(...arguments_),
    createTaskComment: (...arguments_) => createTaskCommentMock(...arguments_),
    getTaskActivity: (...arguments_) => getTaskActivityMock(...arguments_),
    updateTaskStatus: (...arguments_) => updateTaskStatusMock(...arguments_),
}));

function buildTask(overrides = {}) {
    return {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        title: 'Implement task details',
        description: 'Build the complete task details workflow.',
        status: 'pending',
        allowed_transitions: ['in_progress', 'cancelled'],
        priority: 'high',
        team_id: '11111111-1111-4111-8111-111111111111',
        assigned_to: '33333333-3333-4333-8333-333333333333',
        created_by: '22222222-2222-4222-8222-222222222222',
        due_date: '2026-08-10T00:00:00.000000Z',
        updated_at: '2026-08-03T08:00:00.000000Z',
        team: {
            id: '11111111-1111-4111-8111-111111111111',
            name: 'Engineering',
        },
        assignee: {
            id: 3,
            name: 'Team Member',
        },
        creator: {
            id: 2,
            name: 'Team Manager',
        },
        ...overrides,
    };
}

function buildComments() {
    return [
        {
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            body: 'Frontend implementation is ready for review.',
            user: {
                id: 3,
                name: 'Team Member',
            },
            created_at: '2026-08-02T08:00:00.000000Z',
            updated_at: '2026-08-02T08:00:00.000000Z',
        },
        {
            id: 2,
            body: 'Please add validation tests before merging.',
            user: {
                id: 2,
                name: 'Team Manager',
            },
            created_at: '2026-08-03T09:30:00.000000Z',
            updated_at: '2026-08-03T09:30:00.000000Z',
        },
    ];
}

function buildActivityResponse() {
    return {
        data: {
            activity_logs: [
                {
                    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    action: 'task_updated',
                    description: 'Team Manager updated the task.',
                    changes: {
                        priority: {
                            old: 'medium',
                            new: 'high',
                        },
                    },
                    actor: {
                        id: 2,
                        name: 'Team Manager',
                    },
                    created_at: '2026-08-03T10:00:00.000000Z',
                },
                {
                    id: 2,
                    action: 'comment_added',
                    description: 'Team Member added a task comment.',
                    changes: null,
                    actor: {
                        id: 3,
                        name: 'Team Member',
                    },
                    created_at: '2026-08-02T08:00:00.000000Z',
                },
            ],
            status_histories: [
                {
                    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    previous_status: 'pending',
                    new_status: 'in_progress',
                    note: 'Development started.',
                    changed_by: {
                        id: 3,
                        name: 'Team Member',
                    },
                    created_at: '2026-08-01T07:00:00.000000Z',
                },
            ],
        },
    };
}

function renderPage(role = 'admin') {
    return render(
        <MemoryRouter
            initialEntries={['/tasks/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa']}
        >
            <AuthContext.Provider
                value={{
                    user: {
                        id: role === 'team_member' ? 3 : 1,
                        name:
                            role === 'team_member'
                                ? 'Team Member'
                                : 'System Admin',
                        role,
                    },
                    isAuthenticated: true,
                    isInitializing: false,
                    login: vi.fn(),
                    logout: vi.fn(),
                }}
            >
                <TaskDetails />
            </AuthContext.Provider>
        </MemoryRouter>,
    );
}

describe('TaskDetails page', () => {
    beforeEach(() => {
        getTaskMock.mockReset();
        listTaskCommentsMock.mockReset();
        createTaskCommentMock.mockReset();
        getTaskActivityMock.mockReset();
        updateTaskStatusMock.mockReset();

        getTaskMock.mockResolvedValue({
            data: {
                task: buildTask(),
            },
        });

        listTaskCommentsMock.mockResolvedValue({
            data: buildComments(),
        });

        getTaskActivityMock.mockResolvedValue(buildActivityResponse());
    });

    test('shows the task details loading skeleton', () => {
        getTaskMock.mockReturnValue(new Promise(() => {}));
        listTaskCommentsMock.mockReturnValue(new Promise(() => {}));

        renderPage();

        expect(
            screen.getByRole('heading', {
                name: 'Task Details',
            }),
        ).toBeInTheDocument();

        expect(screen.getByText('Loading task details...')).toBeInTheDocument();

        expect(
            screen.getByRole('status', {
                name: '',
            }),
        ).toHaveAttribute('aria-busy', 'true');
    });

    test('loads task information, comments, activity, and transitions', async () => {
        renderPage();

        expect(
            await screen.findByRole('heading', {
                name: 'Implement task details',
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByText('Build the complete task details workflow.'),
        ).toBeInTheDocument();

        expect(screen.getByText('Engineering')).toBeInTheDocument();
        expect(screen.getAllByText('Team Member').length).toBeGreaterThan(0);

        const overviewSection = screen
            .getByRole('heading', {
                name: 'Overview',
            })
            .closest('section');

        expect(overviewSection).not.toBeNull();

        expect(
            within(overviewSection).getByText('Team Manager'),
        ).toBeInTheDocument();

        expect(within(overviewSection).getByText('High')).toBeInTheDocument();
        expect(
            within(overviewSection).getByText('Pending'),
        ).toBeInTheDocument();

        expect(screen.getByLabelText('New status')).toHaveValue('');

        expect(
            within(screen.getByLabelText('New status')).getByRole('option', {
                name: 'In Progress',
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByText('Frontend implementation is ready for review.'),
        ).toBeInTheDocument();

        expect(
            screen.getByText('Team Manager updated the task.'),
        ).toBeInTheDocument();

        expect(
            screen.getByText('Status changed from Pending to In Progress'),
        ).toBeInTheDocument();

        expect(getTaskMock).toHaveBeenCalledWith(
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        );
        expect(listTaskCommentsMock).toHaveBeenCalledWith(
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        );
        expect(getTaskActivityMock).toHaveBeenCalledWith(
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        );
    });

    test('updates task status with a transition note', async () => {
        const user = userEvent.setup();

        const updatedTask = buildTask({
            status: 'in_progress',
            allowed_transitions: ['pending', 'completed', 'cancelled'],
            updated_at: '2026-08-03T11:00:00.000000Z',
        });

        updateTaskStatusMock.mockResolvedValue({
            message: 'Task status updated successfully.',
            data: {
                task: updatedTask,
            },
        });

        getTaskActivityMock
            .mockResolvedValueOnce(buildActivityResponse())
            .mockResolvedValueOnce({
                data: {
                    activity_logs: [],
                    status_histories: [
                        {
                            id: 2,
                            previous_status: 'pending',
                            new_status: 'in_progress',
                            note: 'Starting implementation now.',
                            changed_by: {
                                id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                                name: 'System Admin',
                            },
                            created_at: '2026-08-03T11:00:00.000000Z',
                        },
                    ],
                },
            });

        renderPage();

        await screen.findByRole('heading', {
            name: 'Implement task details',
        });

        await user.selectOptions(
            screen.getByLabelText('New status'),
            'in_progress',
        );

        await user.type(
            screen.getByLabelText('Transition note'),
            '  Starting implementation now.  ',
        );

        await user.click(
            screen.getByRole('button', {
                name: 'Update Status',
            }),
        );

        await waitFor(() => {
            expect(updateTaskStatusMock).toHaveBeenCalledWith(
                'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                'in_progress',
                '  Starting implementation now.  ',
            );
        });

        expect(
            await screen.findByText('Task status updated successfully.'),
        ).toBeInTheDocument();

        expect(screen.getByText('In Progress')).toBeInTheDocument();
        expect(screen.getByLabelText('New status')).toHaveValue('');
        expect(screen.getByLabelText('Transition note')).toHaveValue('');

        expect(getTaskActivityMock).toHaveBeenCalledTimes(2);
    });

    test('displays a rejected transition error', async () => {
        const user = userEvent.setup();

        updateTaskStatusMock.mockRejectedValue({
            response: {
                data: {
                    message: 'The given data was invalid.',
                    errors: {
                        status: [
                            'Transition from pending to completed is not allowed.',
                        ],
                    },
                },
            },
        });

        getTaskMock.mockResolvedValue({
            data: {
                task: buildTask({
                    allowed_transitions: ['completed'],
                }),
            },
        });

        renderPage();

        await screen.findByRole('heading', {
            name: 'Implement task details',
        });

        await user.selectOptions(
            screen.getByLabelText('New status'),
            'completed',
        );

        await user.click(
            screen.getByRole('button', {
                name: 'Update Status',
            }),
        );

        expect(
            await screen.findByText(
                'Transition from pending to completed is not allowed.',
            ),
        ).toBeInTheDocument();

        expect(updateTaskStatusMock).toHaveBeenCalledWith(
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            'completed',
            '',
        );
    });

    test('requires a selected status before submission', async () => {
        const user = userEvent.setup();

        renderPage();

        await screen.findByRole('heading', {
            name: 'Implement task details',
        });

        await user.click(
            screen.getByRole('button', {
                name: 'Update Status',
            }),
        );

        expect(screen.getByText('Select a new status.')).toBeInTheDocument();
        expect(updateTaskStatusMock).not.toHaveBeenCalled();
    });

    test('adds a task comment and refreshes activity', async () => {
        const user = userEvent.setup();

        const newComment = {
            id: 3,
            body: 'The final implementation has been deployed.',
            user: {
                id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                name: 'System Admin',
            },
            created_at: '2026-08-03T12:00:00.000000Z',
            updated_at: '2026-08-03T12:00:00.000000Z',
        };

        createTaskCommentMock.mockResolvedValue({
            message: 'Task comment added successfully.',
            data: {
                comment: newComment,
            },
        });

        getTaskActivityMock
            .mockResolvedValueOnce(buildActivityResponse())
            .mockResolvedValueOnce({
                data: {
                    activity_logs: [
                        {
                            id: 3,
                            action: 'comment_added',
                            description: 'System Admin added a task comment.',
                            changes: null,
                            actor: {
                                id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                                name: 'System Admin',
                            },
                            created_at: '2026-08-03T12:00:00.000000Z',
                        },
                    ],
                    status_histories: [],
                },
            });

        renderPage();

        await screen.findByRole('heading', {
            name: 'Implement task details',
        });

        await user.type(
            screen.getByLabelText('Add an update'),
            '  The final implementation has been deployed.  ',
        );

        await user.click(
            screen.getByRole('button', {
                name: 'Post Comment',
            }),
        );

        await waitFor(() => {
            expect(createTaskCommentMock).toHaveBeenCalledWith(
                'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                'The final implementation has been deployed.',
            );
        });

        expect(
            await screen.findByText('Task comment added successfully.'),
        ).toBeInTheDocument();

        expect(
            screen.getByText('The final implementation has been deployed.'),
        ).toBeInTheDocument();

        expect(screen.getByLabelText('Add an update')).toHaveValue('');
        expect(getTaskActivityMock).toHaveBeenCalledTimes(2);
    });

    test('rejects an empty comment', async () => {
        const user = userEvent.setup();

        renderPage();

        await screen.findByRole('heading', {
            name: 'Implement task details',
        });

        await user.type(screen.getByLabelText('Add an update'), '   ');

        await user.click(
            screen.getByRole('button', {
                name: 'Post Comment',
            }),
        );

        expect(screen.getByText('Enter a comment.')).toBeInTheDocument();
        expect(createTaskCommentMock).not.toHaveBeenCalled();
    });

    test('filters comments by text and date and clears filters', async () => {
        const user = userEvent.setup();

        renderPage();

        await screen.findByText('Frontend implementation is ready for review.');

        await user.type(screen.getByLabelText('Search comments'), 'validation');

        expect(
            screen.getByText('Please add validation tests before merging.'),
        ).toBeInTheDocument();

        expect(
            screen.queryByText('Frontend implementation is ready for review.'),
        ).not.toBeInTheDocument();

        await user.clear(screen.getByLabelText('Search comments'));

        await user.type(
            screen.getByLabelText('Date', {
                selector: '#comment-history-date',
            }),
            '2026-08-02',
        );

        expect(
            screen.getByText('Frontend implementation is ready for review.'),
        ).toBeInTheDocument();

        expect(
            screen.queryByText('Please add validation tests before merging.'),
        ).not.toBeInTheDocument();

        const commentFilters = screen.getByLabelText('Comment filters');

        await user.click(
            within(commentFilters).getByRole('button', {
                name: 'Clear filters',
            }),
        );

        expect(screen.getByLabelText('Search comments')).toHaveValue('');
        expect(
            screen.getByLabelText('Date', {
                selector: '#comment-history-date',
            }),
        ).toHaveValue('');

        expect(
            screen.getByText('Please add validation tests before merging.'),
        ).toBeInTheDocument();
    });

    test('filters activity by actor, type, date, and search', async () => {
        const user = userEvent.setup();

        renderPage();

        await screen.findByText('Team Manager updated the task.');

        await user.selectOptions(
            screen.getByLabelText('Changed by'),
            'Team Member',
        );

        expect(
            screen.getByText('Team Member added a task comment.'),
        ).toBeInTheDocument();

        expect(
            screen.getByText('Status changed from Pending to In Progress'),
        ).toBeInTheDocument();

        expect(
            screen.queryByText('Team Manager updated the task.'),
        ).not.toBeInTheDocument();

        await user.selectOptions(
            screen.getByLabelText('Activity type'),
            'status_changed',
        );

        expect(
            screen.getByText('Status changed from Pending to In Progress'),
        ).toBeInTheDocument();

        expect(
            screen.queryByText('Team Member added a task comment.'),
        ).not.toBeInTheDocument();

        await user.clear(screen.getByLabelText('Search activity'));
        await user.type(
            screen.getByLabelText('Search activity'),
            'development started',
        );

        expect(screen.getByText('Development started.')).toBeInTheDocument();

        const activityFilters = screen.getByLabelText('Activity filters');

        await user.click(
            within(activityFilters).getByRole('button', {
                name: 'Clear filters',
            }),
        );

        expect(screen.getByLabelText('Search activity')).toHaveValue('');
        expect(screen.getByLabelText('Changed by')).toHaveValue('');
        expect(screen.getByLabelText('Activity type')).toHaveValue('');

        expect(
            screen.getByText('Team Manager updated the task.'),
        ).toBeInTheDocument();
    });

    test('does not request or display restricted activity for a team member', async () => {
        renderPage('team_member');

        await screen.findByRole('heading', {
            name: 'Implement task details',
        });

        expect(
            screen.queryByRole('heading', {
                name: 'Activity Log',
            }),
        ).not.toBeInTheDocument();

        expect(getTaskActivityMock).not.toHaveBeenCalled();

        expect(
            screen.queryByRole('link', {
                name: 'Edit Task',
            }),
        ).not.toBeInTheDocument();
    });

    test('hides activity when a manager receives a forbidden response', async () => {
        getTaskActivityMock.mockRejectedValue({
            response: {
                status: 403,
                data: {
                    message: 'This action is unauthorized.',
                },
            },
        });

        renderPage('manager');

        await screen.findByRole('heading', {
            name: 'Implement task details',
        });

        expect(
            screen.queryByRole('heading', {
                name: 'Activity Log',
            }),
        ).not.toBeInTheDocument();

        expect(getTaskActivityMock).toHaveBeenCalledWith(
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        );
    });

    test('displays a task loading failure and retries', async () => {
        const user = userEvent.setup();

        getTaskMock
            .mockRejectedValueOnce({
                response: {
                    data: {
                        message: 'Task service unavailable.',
                    },
                },
            })
            .mockResolvedValueOnce({
                data: {
                    task: buildTask(),
                },
            });

        renderPage();

        expect(
            await screen.findByText('Task service unavailable.'),
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        );

        expect(
            await screen.findByRole('heading', {
                name: 'Implement task details',
            }),
        ).toBeInTheDocument();

        expect(getTaskMock).toHaveBeenCalledTimes(2);
    });
});
