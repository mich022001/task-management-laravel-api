import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';

import TaskTable from '../TaskTable.jsx';

const tasks = [
    {
        id: 1,
        title: 'Build task workflow',
        description: 'Implement task list and forms.',
        status: 'in_progress',
        allowed_transitions: ['pending', 'completed', 'cancelled'],
        priority: 'high',
        due_date: '2026-08-10T00:00:00.000000Z',
        team: {
            name: 'Engineering',
        },
        assignee: {
            name: 'Team Member',
        },
    },
];

function renderTable(properties = {}) {
    return render(
        <MemoryRouter>
            <TaskTable
                tasks={tasks}
                onStatusChange={() => {}}
                {...properties}
            />
        </MemoryRouter>,
    );
}

describe('TaskTable', () => {
    test('displays task information', () => {
        renderTable();

        expect(screen.getByText('Build task workflow')).toBeInTheDocument();
        expect(screen.getByText('In Progress')).toBeInTheDocument();
        expect(screen.getByText('High')).toBeInTheDocument();
        expect(screen.getByText('Engineering')).toBeInTheDocument();
        expect(screen.getByText('Team Member')).toBeInTheDocument();
    });

    test('shows an edit action when editing is allowed', () => {
        renderTable({
            canEditTasks: true,
        });

        expect(
            screen.getByRole('link', {
                name: 'Edit',
            }),
        ).toHaveAttribute('href', '/tasks/1/edit');
    });

    test('hides edit action when editing is not allowed', () => {
        renderTable();

        expect(
            screen.queryByRole('link', {
                name: 'Edit',
            }),
        ).not.toBeInTheDocument();
    });
});
