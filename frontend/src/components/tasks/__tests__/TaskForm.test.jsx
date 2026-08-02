import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import TaskForm from '../TaskForm.jsx';

const values = {
    title: '',
    description: '',
    priority: '',
    team_id: '',
    assigned_to: '',
    due_date: '',
};

describe('TaskForm', () => {
    test('renders task fields and submits values', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        const onSubmit = vi.fn();

        render(
            <TaskForm
                values={values}
                teams={[
                    {
                        id: 1,
                        name: 'Engineering',
                    },
                ]}
                members={[]}
                onChange={onChange}
                onSubmit={onSubmit}
                onCancel={vi.fn()}
            />,
        );

        expect(screen.getByLabelText(/Title/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Priority/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Assigned Team/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Assignee/)).toBeDisabled();
        expect(screen.getByLabelText(/Due Date/)).toBeInTheDocument();

        await user.type(screen.getByLabelText(/Title/), 'Build frontend');

        expect(onChange).toHaveBeenCalled();

        await user.click(
            screen.getByRole('button', {
                name: 'Create Task',
            }),
        );

        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    test('shows validation errors and team members', () => {
        render(
            <TaskForm
                values={{
                    ...values,
                    team_id: '1',
                }}
                teams={[
                    {
                        id: 1,
                        name: 'Engineering',
                    },
                ]}
                members={[
                    {
                        id: 3,
                        name: 'Team Member',
                    },
                ]}
                errors={{
                    title: ['The title field is required.'],
                }}
                onChange={vi.fn()}
                onSubmit={vi.fn()}
                onCancel={vi.fn()}
            />,
        );

        expect(
            screen.getByText('The title field is required.'),
        ).toBeInTheDocument();

        expect(
            screen.getByRole('option', {
                name: 'Team Member',
            }),
        ).toBeInTheDocument();
    });

    test('shows loading and submitting states', () => {
        render(
            <TaskForm
                values={{
                    ...values,
                    team_id: '1',
                }}
                teams={[]}
                members={[]}
                isLoadingMembers
                isSubmitting
                onChange={vi.fn()}
                onSubmit={vi.fn()}
                onCancel={vi.fn()}
            />,
        );

        expect(
            screen.getByRole('option', {
                name: 'Loading members...',
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', {
                name: 'Saving...',
            }),
        ).toBeDisabled();
    });
});
