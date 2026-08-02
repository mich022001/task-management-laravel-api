import AxiosMockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import laravelClient from '../../api/laravelClient.js';
import {
    createTask,
    createTaskComment,
    deleteTask,
    getTask,
    getTaskActivity,
    listTaskComments,
    listTasks,
    updateTask,
    updateTaskStatus,
} from '../task.service.js';

describe('Task service', () => {
    let mock;

    beforeEach(() => {
        mock = new AxiosMockAdapter(laravelClient);
    });

    afterEach(() => {
        mock.restore();
    });

    test('lists tasks with normalized filters', async () => {
        mock.onGet('/tasks').reply((config) => {
            expect(config.params).toEqual({
                page: 2,
                status: 'pending',
            });

            return [
                200,
                {
                    data: [],
                    meta: {
                        current_page: 2,
                    },
                },
            ];
        });

        const result = await listTasks({
            page: 2,
            status: 'pending',
            priority: '',
            team_id: null,
        });

        expect(result.meta.current_page).toBe(2);
    });

    test('retrieves one task', async () => {
        mock.onGet('/tasks/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa').reply(200, {
            data: {
                task: {
                    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                },
            },
        });

        const result = await getTask('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

        expect(result.data.task.id).toBe(
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        );
    });

    test('creates a task', async () => {
        const payload = {
            team_id: '11111111-1111-4111-8111-111111111111',
            title: 'Build task UI',
            priority: 'high',
        };

        mock.onPost('/tasks', payload).reply(201, {
            data: {
                task: {
                    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    ...payload,
                },
            },
        });

        const result = await createTask(payload);

        expect(result.data.task.id).toBe(
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        );
    });

    test('updates a task', async () => {
        mock.onPatch('/tasks/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', {
            title: 'Updated title',
        }).reply(200, {
            data: {
                task: {
                    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    title: 'Updated title',
                },
            },
        });

        const result = await updateTask(
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            {
                title: 'Updated title',
            },
        );

        expect(result.data.task.title).toBe('Updated title');
    });

    test('updates task status', async () => {
        mock.onPatch('/tasks/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/status', {
            status: 'in_progress',
        }).reply(200, {
            data: {
                task: {
                    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    status: 'in_progress',
                },
            },
        });

        const result = await updateTaskStatus(
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            'in_progress',
        );

        expect(result.data.task.status).toBe('in_progress');
    });

    test('lists task comments', async () => {
        mock.onGet(
            '/tasks/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/comments',
        ).reply(200, {
            data: [
                {
                    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    body: 'Ready for review.',
                },
            ],
        });

        const result = await listTaskComments(
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        );

        expect(result.data[0].body).toBe('Ready for review.');
    });

    test('creates a task comment', async () => {
        mock.onPost('/tasks/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/comments', {
            body: 'Ready for review.',
        }).reply(201, {
            data: {
                comment: {
                    id: 2,
                    body: 'Ready for review.',
                },
            },
        });

        const result = await createTaskComment(
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            '  Ready for review.  ',
        );

        expect(result.data.comment.id).toBe(2);
    });

    test('retrieves task activity', async () => {
        mock.onGet(
            '/tasks/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/activity',
        ).reply(200, {
            data: {
                activity_logs: [],
                status_histories: [],
            },
        });

        const result = await getTaskActivity(
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        );

        expect(result.data.activity_logs).toEqual([]);
    });

    test('deletes a task', async () => {
        mock.onDelete('/tasks/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa').reply(
            200,
            {
                message: 'Task deleted successfully.',
            },
        );

        const result = await deleteTask('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

        expect(result.message).toBe('Task deleted successfully.');
    });
});
