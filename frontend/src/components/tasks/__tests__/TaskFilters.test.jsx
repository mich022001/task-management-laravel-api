import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import TaskFilters from '../TaskFilters.jsx';

const initialFilters = {
    search: '',
    status: '',
    priority: '',
    team_id: '',
};

describe('Task filters', () => {
    test('updates search, status, priority, and team values', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(
            <TaskFilters
                filters={initialFilters}
                teams={[
                    {
                        id: 1,
                        name: 'Engineering',
                    },
                ]}
                showTeamFilter
                onChange={onChange}
                onSubmit={vi.fn()}
                onReset={vi.fn()}
            />,
        );

        await user.type(screen.getByLabelText('Search'), 'dashboard');

        await user.selectOptions(
            screen.getByLabelText('Status'),
            'in_progress',
        );

        await user.selectOptions(screen.getByLabelText('Priority'), 'high');

        await user.selectOptions(screen.getByLabelText('Team'), '1');

        expect(onChange).toHaveBeenCalled();
    });

    test('submits and resets filters', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        const onReset = vi.fn();

        render(
            <TaskFilters
                filters={initialFilters}
                teams={[]}
                showTeamFilter={false}
                onChange={vi.fn()}
                onSubmit={onSubmit}
                onReset={onReset}
            />,
        );

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

        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onReset).toHaveBeenCalledTimes(1);
    });

    test('hides the team filter when access is restricted', () => {
        render(
            <TaskFilters
                filters={initialFilters}
                teams={[]}
                showTeamFilter={false}
                onChange={vi.fn()}
                onSubmit={vi.fn()}
                onReset={vi.fn()}
            />,
        );

        expect(screen.queryByLabelText('Team')).not.toBeInTheDocument();
    });
});
