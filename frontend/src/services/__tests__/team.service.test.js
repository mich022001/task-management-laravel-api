import AxiosMockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import laravelClient from '../../api/laravelClient.js';
import { getTeam, listTeams } from '../team.service.js';

const TEAM_UUID = '11111111-1111-4111-8111-111111111111';
const MEMBER_UUID = '33333333-3333-4333-8333-333333333333';

describe('Team service', () => {
    let mock;

    beforeEach(() => {
        mock = new AxiosMockAdapter(laravelClient);
    });

    afterEach(() => {
        mock.restore();
    });

    test('lists teams with parameters', async () => {
        mock.onGet('/teams').reply((config) => {
            expect(config.params).toEqual({
                per_page: 100,
                search: 'engineering',
            });

            return [
                200,
                {
                    data: [
                        {
                            id: TEAM_UUID,
                            name: 'Engineering',
                        },
                    ],
                },
            ];
        });

        const result = await listTeams({
            per_page: 100,
            search: 'engineering',
        });

        expect(result.data).toHaveLength(1);
        expect(result.data[0].id).toBe(TEAM_UUID);
    });

    test('retrieves one team with members', async () => {
        mock.onGet(`/teams/${TEAM_UUID}`).reply(200, {
            data: {
                team: {
                    id: TEAM_UUID,
                    name: 'Engineering',
                    members: [
                        {
                            id: MEMBER_UUID,
                            name: 'Team Member',
                        },
                    ],
                },
            },
        });

        const result = await getTeam(TEAM_UUID);

        expect(result.data.team.id).toBe(TEAM_UUID);
        expect(result.data.team.members).toHaveLength(1);
        expect(result.data.team.members[0].id).toBe(MEMBER_UUID);
    });
});
