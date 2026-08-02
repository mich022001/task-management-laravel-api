import AxiosMockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import nodeClient from '../../api/nodeClient.js';
import { getTaskSummary, getUpcomingDeadlines } from '../analytics.service.js';

describe('Analytics service', () => {
    let mock;

    beforeEach(() => {
        mock = new AxiosMockAdapter(nodeClient);
    });

    afterEach(() => {
        mock.restore();
    });

    test('retrieves task summary', async () => {
        mock.onGet('/analytics/tasks/summary').reply((config) => {
            expect(config.params).toEqual({
                team_id: '11111111-1111-4111-8111-111111111111',
            });

            return [
                200,
                {
                    data: {
                        total_tasks: 5,
                        completed_tasks: 2,
                    },
                },
            ];
        });

        const result = await getTaskSummary({
            team_id: '11111111-1111-4111-8111-111111111111',
        });

        expect(result.data.total_tasks).toBe(5);
    });

    test('retrieves upcoming deadlines', async () => {
        mock.onGet('/analytics/deadlines/upcoming').reply((config) => {
            expect(config.params).toEqual({
                days: 7,
            });

            return [
                200,
                {
                    data: {
                        upcoming: [],
                        overdue: [],
                    },
                },
            ];
        });

        const result = await getUpcomingDeadlines({
            days: 7,
        });

        expect(result.data.upcoming).toEqual([]);
    });
});
