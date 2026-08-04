import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import DashboardOverview from '../DashboardOverview.jsx';

const summary = {
    total_tasks: 10,
    status: {
        pending: 2,
        in_progress: 3,
        completed: 4,
        cancelled: 1,
    },
    priority: {
        low: 2,
        medium: 3,
        high: 5,
    },
    completion_rate: 40,
};

const deadlines = {
    range_days: 7,
    overdue: [
        {
            id: 'task-1',
            title: 'Overdue task',
            status: 'in_progress',
            priority: 'high',
            due_date: '2026-08-01T00:00:00.000Z',
        },
    ],
    upcoming: [
        {
            id: 'task-2',
            title: 'Upcoming task',
            status: 'pending',
            priority: 'medium',
            due_date: '2026-08-08T00:00:00.000Z',
        },
    ],
};

const teamHighlights = {
    teams: [
        {
            team_id: 'team-1',
            team_name: 'Engineering',
            member_count: 5,
            total_tasks: 10,
            status: {
                yet_to_start: 2,
                in_progress: 3,
                completed: 4,
                cancelled: 1,
            },
            overdue_tasks: 1,
            priority: {
                low: 2,
                medium: 3,
                high: 5,
            },
            completion_rate: 40,
        },
    ],
    totals: {
        teams: 1,
        members: 5,
        tasks: 10,
        overdue: 1,
        high_priority: 5,
        high_priority_overdue: 1,
    },
};

describe('Dashboard overview', () => {
    test('displays status, priority, deadline, and team analytics', () => {
        render(
            <DashboardOverview
                summary={summary}
                deadlines={deadlines}
                teamHighlights={teamHighlights}
            />,
        );

        expect(screen.getByText('Task Status Overview')).toBeInTheDocument();
        expect(screen.getByText('Priority Distribution')).toBeInTheDocument();
        expect(screen.getByText('Deadlines')).toBeInTheDocument();
        expect(screen.getByText('Team Workload')).toBeInTheDocument();

        expect(screen.getByText('Overdue task')).toBeInTheDocument();
        expect(screen.getByText('Upcoming task')).toBeInTheDocument();
        expect(screen.getByText('Engineering')).toBeInTheDocument();
    });

    test('hides team workload when no team analytics are available', () => {
        render(
            <DashboardOverview
                summary={summary}
                deadlines={{
                    range_days: 7,
                    overdue: [],
                    upcoming: [],
                }}
                teamHighlights={{
                    teams: [],
                    totals: {
                        teams: 0,
                    },
                }}
            />,
        );

        expect(
            screen.getByText('No overdue or upcoming deadlines.'),
        ).toBeInTheDocument();

        expect(screen.queryByText('Team Workload')).not.toBeInTheDocument();
    });
});
