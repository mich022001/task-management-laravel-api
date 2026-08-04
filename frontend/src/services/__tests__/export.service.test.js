import { beforeEach, describe, expect, test, vi } from 'vitest';

const getMock = vi.fn();
const postMock = vi.fn();

vi.mock('../../api/nodeClient.js', () => ({
    default: {
        get: (...arguments_) => getMock(...arguments_),
        post: (...arguments_) => postMock(...arguments_),
    },
}));

const { downloadTasks, getExportOptions } =
    await import('../export.service.js');

describe('task export service', () => {
    beforeEach(() => {
        getMock.mockReset();
        postMock.mockReset();
    });

    test('retrieves role-scoped export options', async () => {
        const responseData = {
            message: 'Export options retrieved successfully.',
            data: {
                scope: 'all',
                teams: [
                    {
                        id: '11111111-1111-4111-8111-111111111111',
                        name: 'Engineering',
                    },
                ],
                users: [
                    {
                        id: '33333333-3333-4333-8333-333333333333',
                        name: 'Michael Developer',
                        email: 'michael@example.com',
                        role: 'team_member',
                    },
                ],
            },
        };

        getMock.mockResolvedValue({
            data: responseData,
        });

        const result = await getExportOptions();

        expect(getMock).toHaveBeenCalledTimes(1);
        expect(getMock).toHaveBeenCalledWith('/export/options');
        expect(result).toEqual(responseData);
    });

    test('posts the required export contract as a blob request', async () => {
        const blob = new Blob(['export']);

        postMock.mockResolvedValue({
            data: blob,
            headers: {
                'content-disposition': 'attachment; filename="tasks.csv"',
            },
        });

        const result = await downloadTasks({
            format: 'csv',
            team_id: 'team-uuid',
            filters: {
                status: 'completed',
                priority: '',
                date_from: '2026-08-01',
            },
        });

        expect(postMock).toHaveBeenCalledWith(
            '/export/tasks',
            {
                format: 'csv',
                team_id: 'team-uuid',
                filters: {
                    status: 'completed',
                    date_from: '2026-08-01',
                },
            },
            {
                responseType: 'blob',
            },
        );

        expect(result).toEqual({
            blob,
            contentDisposition: 'attachment; filename="tasks.csv"',
        });
    });

    test('omits an empty team identifier', async () => {
        postMock.mockResolvedValue({
            data: new Blob([]),
            headers: {},
        });

        await downloadTasks({
            format: 'json',
            team_id: '',
            filters: {},
        });

        expect(postMock).toHaveBeenCalledWith(
            '/export/tasks',
            {
                format: 'json',
                team_id: undefined,
                filters: {},
            },
            {
                responseType: 'blob',
            },
        );
    });
});
