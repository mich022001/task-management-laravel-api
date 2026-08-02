import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import TaskPagination from '../TaskPagination.jsx';

describe('Task pagination', () => {
    test('changes pages using previous and next controls', async () => {
        const user = userEvent.setup();
        const onPageChange = vi.fn();

        render(
            <TaskPagination
                currentPage={2}
                lastPage={4}
                total={35}
                onPageChange={onPageChange}
            />,
        );

        await user.click(
            screen.getByRole('button', {
                name: 'Previous',
            }),
        );

        await user.click(
            screen.getByRole('button', {
                name: 'Next',
            }),
        );

        expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
        expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
    });

    test('does not render for a single page', () => {
        const { container } = render(
            <TaskPagination
                currentPage={1}
                lastPage={1}
                total={5}
                onPageChange={vi.fn()}
            />,
        );

        expect(container).toBeEmptyDOMElement();
    });
});
