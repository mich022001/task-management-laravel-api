import { beforeEach, describe, expect, test, vi } from 'vitest';

import laravelClient from '../../api/laravelClient.js';
import {
    addTeamMember,
    createTeam,
    getTeam,
    listTeams,
    removeTeamMember,
} from '../team.service.js';

vi.mock('../../api/laravelClient.js', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('team service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('lists teams with query parameters', async () => {
        const payload = {
            data: [],
            meta: {
                current_page: 1,
                last_page: 1,
                total: 0,
            },
        };

        laravelClient.get.mockResolvedValue({
            data: payload,
        });

        const parameters = {
            search: 'engineering',
            page: 1,
        };

        const response = await listTeams(parameters);

        expect(laravelClient.get).toHaveBeenCalledWith('/teams', {
            params: parameters,
        });

        expect(response).toEqual(payload);
    });

    test('retrieves a team by UUID', async () => {
        const payload = {
            data: {
                team: {
                    id: 'team-uuid',
                    name: 'Engineering',
                    members: [],
                },
            },
        };

        laravelClient.get.mockResolvedValue({
            data: payload,
        });

        const response = await getTeam('team-uuid');

        expect(laravelClient.get).toHaveBeenCalledWith('/teams/team-uuid');

        expect(response).toEqual(payload);
    });

    test('creates a team', async () => {
        const credentials = {
            name: 'Platform Engineering',
        };

        const payload = {
            data: {
                team: {
                    id: 'new-team-uuid',
                    name: credentials.name,
                },
            },
        };

        laravelClient.post.mockResolvedValue({
            data: payload,
        });

        const response = await createTeam(credentials);

        expect(laravelClient.post).toHaveBeenCalledWith('/teams', credentials);

        expect(response).toEqual(payload);
    });

    test('adds a member to a team', async () => {
        const membership = {
            user_id: 'user-uuid',
            member_role: 'member',
        };

        const payload = {
            data: {
                team: {
                    id: 'team-uuid',
                    members: [
                        {
                            id: 'user-uuid',
                            member_role: 'member',
                        },
                    ],
                },
            },
        };

        laravelClient.post.mockResolvedValue({
            data: payload,
        });

        const response = await addTeamMember('team-uuid', membership);

        expect(laravelClient.post).toHaveBeenCalledWith(
            '/teams/team-uuid/members',
            membership,
        );

        expect(response).toEqual(payload);
    });

    test('removes a member from a team', async () => {
        const payload = {
            message: 'Team member removed successfully.',
        };

        laravelClient.delete.mockResolvedValue({
            data: payload,
        });

        const response = await removeTeamMember('team-uuid', 'user-uuid');

        expect(laravelClient.delete).toHaveBeenCalledWith(
            '/teams/team-uuid/members/user-uuid',
        );

        expect(response).toEqual(payload);
    });
});
