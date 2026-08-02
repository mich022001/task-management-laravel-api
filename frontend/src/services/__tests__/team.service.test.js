import AxiosMockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import laravelClient from '../../api/laravelClient.js';
import { getTeam, listTeams } from '../team.service.js';

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
                            id: 1,
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
    });

    test('retrieves one team with members', async () => {
        mock.onGet('/teams/1').reply(200, {
            data: {
                team: {
                    id: 1,
                    members: [
                        {
                            id: 3,
                            name: 'Team Member',
                        },
                    ],
                },
            },
        });

        const result = await getTeam(1);

        expect(result.data.team.members).toHaveLength(1);
    });
});
