import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import EditTeam from '../EditTeam.jsx';

const getTeamMock = vi.fn();
const updateTeamMock = vi.fn();
const listUsersMock = vi.fn();

vi.mock('../../services/team.service.js', () => ({
    getTeam: (...arguments_) => getTeamMock(...arguments_),
    updateTeam: (...arguments_) => updateTeamMock(...arguments_),
}));

vi.mock('../../services/user.service.js', () => ({
    listUsers: (...arguments_) => listUsersMock(...arguments_),
}));

function renderPage() {
    return render(
        <MemoryRouter initialEntries={['/teams/team-uuid/edit']}>
            <Routes>
                <Route path="/teams/:teamId/edit" element={<EditTeam />} />
                <Route
                    path="/teams/:teamId"
                    element={<p>Team details page</p>}
                />
            </Routes>
        </MemoryRouter>,
    );
}

describe('EditTeam page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();

        getTeamMock.mockResolvedValue({
            data: {
                team: {
                    id: 'team-uuid',
                    name: 'Engineering',
                    members: [
                        {
                            id: 'manager-uuid',
                            name: 'Manager One',
                            email: 'manager@example.com',
                            member_role: 'lead',
                        },
                    ],
                },
            },
        });

        listUsersMock.mockResolvedValue({
            data: [
                {
                    id: 'manager-uuid',
                    name: 'Manager One',
                    email: 'manager@example.com',
                },
                {
                    id: 'manager-two-uuid',
                    name: 'Manager Two',
                    email: 'manager2@example.com',
                },
            ],
        });
    });

    test('loads existing team values', async () => {
        renderPage();

        expect(screen.getByText('Loading team form...')).toBeInTheDocument();

        expect(
            await screen.findByDisplayValue('Engineering'),
        ).toBeInTheDocument();

        expect(screen.getByLabelText(/Assigned manager/)).toHaveValue(
            'manager-uuid',
        );

        expect(getTeamMock).toHaveBeenCalledWith('team-uuid');

        expect(listUsersMock).toHaveBeenCalledWith({
            role: 'manager',
            status: 'active',
            per_page: 100,
        });
    });

    test('updates the team and redirects to details', async () => {
        const user = userEvent.setup();

        updateTeamMock.mockResolvedValue({
            message: 'Team updated successfully.',
            data: {
                team: {
                    id: 'team-uuid',
                    name: 'Platform Engineering',
                },
            },
        });

        renderPage();

        const nameInput = await screen.findByLabelText(/Team name/);

        await user.clear(nameInput);
        await user.type(nameInput, 'Platform Engineering');

        await user.selectOptions(
            screen.getByLabelText(/Assigned manager/),
            'manager-two-uuid',
        );

        await user.click(
            screen.getByRole('button', {
                name: 'Save changes',
            }),
        );

        await waitFor(() => {
            expect(updateTeamMock).toHaveBeenCalledWith('team-uuid', {
                name: 'Platform Engineering',
                manager_id: 'manager-two-uuid',
            });
        });

        expect(
            await screen.findByText('Team details page'),
        ).toBeInTheDocument();

        expect(sessionStorage.getItem('team_success_message')).toBe(
            'Team updated successfully.',
        );
    });

    test('shows Laravel validation errors', async () => {
        const user = userEvent.setup();

        updateTeamMock.mockRejectedValue({
            response: {
                data: {
                    message: 'The given data was invalid.',
                    errors: {
                        name: ['The name has already been taken.'],
                    },
                },
            },
        });

        renderPage();

        const nameInput = await screen.findByLabelText(/Team name/);

        await user.clear(nameInput);
        await user.type(nameInput, 'Existing Team');

        await user.click(
            screen.getByRole('button', {
                name: 'Save changes',
            }),
        );

        expect(
            await screen.findByText('The name has already been taken.'),
        ).toBeInTheDocument();
    });
});
