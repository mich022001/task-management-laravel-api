import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import DashboardCards from '../DashboardCards.jsx';

describe('Dashboard cards', () => {
    test('displays analytics summary values', () => {
        render(
            <DashboardCards
                summary={{
                    total_tasks: 12,
                    status: {
                        pending: 3,
                        in_progress: 4,
                        completed: 5,
                        cancelled: 0,
                    },
                    completed_tasks: 5,
                    overdue_tasks: 2,
                    completion_rate: 41.67,
                }}
            />,
        );

        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('In Progress')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('Overdue')).toBeInTheDocument();

        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('41.67% completion rate.')).toBeInTheDocument();
    });

    test('uses zero values for missing summary properties', () => {
        render(<DashboardCards summary={{}} />);

        const zeroValues = screen.getAllByText('0');

        expect(zeroValues).toHaveLength(5);
    });
});
