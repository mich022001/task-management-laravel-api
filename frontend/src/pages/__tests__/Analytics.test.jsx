import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AuthContext } from '../../context/auth-context.js';
import Analytics from '../Analytics.jsx';

const getTaskSummaryMock = vi.fn();
const getTeamProductivityMock = vi.fn();
const getUpcomingDeadlinesMock = vi.fn();
const listTeamsMock = vi.fn();

vi.mock('../../services/analytics.service.js', () => ({
    getTaskSummary: (...arguments_) => getTaskSummaryMock(...arguments_),
    getTeamProductivity: (...arguments_) =>
        getTeamProductivityMock(...arguments_),
    getUpcomingDeadlines: (...arguments_) =>
        getUpcomingDeadlinesMock(...arguments_),
}));

vi.mock('../../services/team.service.js', () => ({
    listTeams: (...arguments_) => listTeamsMock(...arguments_),
}));

function createSummary(overrides = {}) {
    return {
        total_tasks: 6,
        status: {
            pending: 1,
            in_progress: 2,
            completed: 3,
            cancelled: 0,
        },
        priority: {
            low: 1,
            medium: 2,
            high: 3,
        },
        completed_tasks: 3,
        overdue_tasks: 1,
        completion_rate: 50,
        average_completion_days: 2.5,
        average_completion_days_by_priority: {
            low: 1,
            medium: 2,
            high: 4,
        },
        ...overrides,
    };
}

function createProductivity(teamId = 'team-1', teamName = 'Engineering') {
    return {
        team: {
            id: teamId,
            name: teamName,
        },
        summary: {
            total_tasks: 6,
            pending_tasks: 1,
            in_progress_tasks: 2,
            completed_tasks: 3,
            cancelled_tasks: 0,
            overdue_tasks: 1,
            completion_rate: 50,
            average_completion_days: 2.5,
            average_completion_days_by_priority: {
                low: 1,
                medium: 2,
                high: 4,
            },
        },
        members: [
            {
                user_id: 'member-1',
                name: 'Michael Developer',
                email: 'michael@example.com',
                member_role: 'member',
                assigned_tasks: 4,
                completed_tasks: 3,
                completion_rate: 75,
                priority: {
                    low: 1,
                    medium: 1,
                    high: 2,
                },
                average_completion_days: 3,
                average_completion_days_by_priority: {
                    low: 1,
                    medium: 3,
                    high: 4,
                },
            },
        ],
    };
}

function renderAnalytics(user = { id: 'admin-1', role: 'admin' }) {
    return render(
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: true,
                isInitializing: false,
                login: vi.fn(),
                logout: vi.fn(),
            }}
        >
            <MemoryRouter>
                <Analytics />
            </MemoryRouter>
        </AuthContext.Provider>,
    );
}

describe('Analytics page', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        listTeamsMock.mockResolvedValue({
            data: [
                {
                    id: 'team-1',
                    name: 'Engineering',
                },
                {
                    id: 'team-2',
                    name: 'Operations',
                },
            ],
        });

        getTaskSummaryMock.mockResolvedValue({
            data: createSummary(),
        });

        getTeamProductivityMock.mockResolvedValue({
            data: createProductivity(),
        });

        getUpcomingDeadlinesMock.mockResolvedValue({
            data: {
                range_days: 7,
                overdue: [
                    {
                        id: 'task-overdue',
                        title: 'Fix production issue',
                        priority: 'high',
                        due_date: '2026-08-02T08:00:00.000Z',
                    },
                ],
                upcoming: [
                    {
                        id: 'task-upcoming',
                        title: 'Prepare deployment report',
                        priority: 'medium',
                        due_date: '2026-08-05T08:00:00.000Z',
                    },
                ],
            },
        });
    });

    test('renders task, priority, productivity, and deadline analytics', async () => {
        renderAnalytics();

        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByText('Loading...')).toBeInTheDocument();

        expect(
            await screen.findByRole('heading', {
                name: 'Analytics',
            }),
        ).toBeInTheDocument();

        expect(screen.getByText('50%')).toBeInTheDocument();
        expect(screen.getByText('2.5 days')).toBeInTheDocument();

        expect(screen.getAllByText('Low priority').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Medium priority').length).toBeGreaterThan(
            0,
        );
        expect(screen.getAllByText('High priority').length).toBeGreaterThan(0);

        expect(screen.getByText('Michael Developer')).toBeInTheDocument();
        expect(screen.getByText('Fix production issue')).toBeInTheDocument();
        expect(
            screen.getByText('Prepare deployment report'),
        ).toBeInTheDocument();

        expect(getTeamProductivityMock).toHaveBeenCalledWith('team-1');
    });

    test('reloads analytics when another team is selected', async () => {
        getTeamProductivityMock
            .mockResolvedValueOnce({
                data: createProductivity(),
            })
            .mockResolvedValueOnce({
                data: createProductivity('team-2', 'Operations'),
            });

        renderAnalytics();

        const teamSelect = await screen.findByLabelText('Team');

        await act(async () => {
            fireEvent.change(teamSelect, {
                target: {
                    value: 'team-2',
                },
            });
        });

        await waitFor(() => {
            expect(getTaskSummaryMock).toHaveBeenLastCalledWith({
                team_id: 'team-2',
            });

            expect(getTeamProductivityMock).toHaveBeenLastCalledWith('team-2');
        });
    });

    test('team member receives personal analytics without team productivity', async () => {
        renderAnalytics({
            id: 'member-1',
            role: 'team_member',
        });

        expect(
            await screen.findByRole('heading', {
                name: 'Analytics',
            }),
        ).toBeInTheDocument();

        expect(listTeamsMock).not.toHaveBeenCalled();
        expect(getTeamProductivityMock).not.toHaveBeenCalled();

        expect(getTaskSummaryMock).toHaveBeenCalledWith({});
        expect(getUpcomingDeadlinesMock).toHaveBeenCalledWith({
            days: 7,
        });
    });

    test('shows an error state when analytics loading fails', async () => {
        listTeamsMock.mockRejectedValueOnce(
            new Error('Analytics service unavailable.'),
        );

        renderAnalytics();

        expect(
            await screen.findByText('Unable to load analytics'),
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                'Something went wrong while loading this content.',
            ),
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        ).toBeInTheDocument();
    });
});
