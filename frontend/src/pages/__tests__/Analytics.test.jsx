import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AuthContext } from '../../context/auth-context.js';
import Analytics from '../Analytics.jsx';

const getTaskSummaryMock = vi.fn();
const getTeamHighlightsMock = vi.fn();
const getTeamReportMock = vi.fn();
const getUpcomingDeadlinesMock = vi.fn();
const listTeamsMock = vi.fn();

vi.mock('../../services/analytics.service.js', () => ({
    getTaskSummary: (...arguments_) => getTaskSummaryMock(...arguments_),
    getTeamHighlights: (...arguments_) => getTeamHighlightsMock(...arguments_),
    getTeamReport: (...arguments_) => getTeamReportMock(...arguments_),
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

function createTeamReport(teamId = 'team-1', teamName = 'Engineering') {
    const productivity = createProductivity(teamId, teamName);

    return {
        team: {
            id: teamId,
            name: teamName,
        },
        summary: {
            ...productivity.summary,
            status: {
                pending: productivity.summary.pending_tasks,
                yet_to_start: productivity.summary.pending_tasks,
                in_progress: productivity.summary.in_progress_tasks,
                completed: productivity.summary.completed_tasks,
                cancelled: productivity.summary.cancelled_tasks,
            },
            priority: {
                low: 1,
                medium: 2,
                high: 3,
            },
            yet_to_start_tasks: productivity.summary.pending_tasks,
            unfinished_tasks:
                productivity.summary.pending_tasks +
                productivity.summary.in_progress_tasks,
        },
        deadlines: {
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
        members: productivity.members.map((member) => ({
            user_id: member.user_id,
            name: member.name,
            email: member.email,
            member_role: member.member_role,
            summary: {
                assigned_tasks: member.assigned_tasks,
                total_tasks: member.assigned_tasks,
                completed_tasks: member.completed_tasks,
                pending_tasks: Math.max(
                    member.assigned_tasks - member.completed_tasks,
                    0,
                ),
                yet_to_start_tasks: 0,
                in_progress_tasks: 0,
                cancelled_tasks: 0,
                overdue_tasks: 0,
                completion_rate: member.completion_rate,
                priority: member.priority,
                average_completion_days: member.average_completion_days,
                average_completion_days_by_priority:
                    member.average_completion_days_by_priority,
            },
            tasks: [],
        })),
        unassigned_tasks: [],
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

        getTeamHighlightsMock.mockResolvedValue({
            data: {
                teams: [
                    {
                        team_id: 'team-1',
                        team_name: 'Engineering',
                        member_count: 1,
                        total_tasks: 6,
                        status: {
                            yet_to_start: 1,
                            pending: 1,
                            in_progress: 2,
                            completed: 3,
                            cancelled: 0,
                        },
                        overdue_tasks: 1,
                        priority: {
                            low: 1,
                            medium: 2,
                            high: 3,
                        },
                        high_priority: {
                            pending: 1,
                            in_progress: 1,
                            completed: 1,
                            cancelled: 0,
                            overdue: 1,
                        },
                        completion_rate: 50,
                        average_completion_days: 2.5,
                    },
                    {
                        team_id: 'team-2',
                        team_name: 'Operations',
                        member_count: 1,
                        total_tasks: 2,
                        status: {
                            yet_to_start: 1,
                            pending: 1,
                            in_progress: 0,
                            completed: 1,
                            cancelled: 0,
                        },
                        overdue_tasks: 0,
                        priority: {
                            low: 1,
                            medium: 1,
                            high: 0,
                        },
                        high_priority: {
                            pending: 0,
                            in_progress: 0,
                            completed: 0,
                            cancelled: 0,
                            overdue: 0,
                        },
                        completion_rate: 50,
                        average_completion_days: 1,
                    },
                ],
            },
        });

        getTeamReportMock.mockImplementation(async (teamId) => {
            const teamName = teamId === 'team-2' ? 'Operations' : 'Engineering';

            return {
                data: createTeamReport(teamId, teamName),
            };
        });

        getTaskSummaryMock.mockResolvedValue({
            data: createSummary(),
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

        expect(screen.getAllByText('50%').length).toBeGreaterThan(0);
        expect(screen.getAllByText('2.5 days').length).toBeGreaterThan(0);

        expect(screen.getAllByText('Low priority').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Medium priority').length).toBeGreaterThan(
            0,
        );
        expect(screen.getAllByText('High priority').length).toBeGreaterThan(0);

        expect(screen.getAllByText('Michael Developer').length).toBeGreaterThan(
            0,
        );
        expect(screen.getByText('Fix production issue')).toBeInTheDocument();
        expect(
            screen.getByText('Prepare deployment report'),
        ).toBeInTheDocument();

        expect(getTeamReportMock).toHaveBeenCalledWith('team-1', {});

        expect(getTaskSummaryMock).not.toHaveBeenCalled();
        expect(getUpcomingDeadlinesMock).not.toHaveBeenCalled();
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
