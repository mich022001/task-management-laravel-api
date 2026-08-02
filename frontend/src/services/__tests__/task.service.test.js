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
        mock.onGet('/tasks/7').reply(200, {
            data: {
                task: {
                    id: 7,
                },
            },
        });

        const result = await getTask(7);

        expect(result.data.task.id).toBe(7);
    });

    test('creates a task', async () => {
        const payload = {
            team_id: 1,
            title: 'Build task UI',
            priority: 'high',
        };

        mock.onPost('/tasks', payload).reply(201, {
            data: {
                task: {
                    id: 10,
                    ...payload,
                },
            },
        });

        const result = await createTask(payload);

        expect(result.data.task.id).toBe(10);
    });

    test('updates a task', async () => {
        mock.onPatch('/tasks/10', {
            title: 'Updated title',
        }).reply(200, {
            data: {
                task: {
                    id: 10,
                    title: 'Updated title',
                },
            },
        });

        const result = await updateTask(10, {
            title: 'Updated title',
        });

        expect(result.data.task.title).toBe('Updated title');
    });

    test('updates task status', async () => {
        mock.onPatch('/tasks/10/status', {
            status: 'in_progress',
        }).reply(200, {
            data: {
                task: {
                    id: 10,
                    status: 'in_progress',
                },
            },
        });

        const result = await updateTaskStatus(10, 'in_progress');

        expect(result.data.task.status).toBe('in_progress');
    });

    test('lists task comments', async () => {
        mock.onGet('/tasks/10/comments').reply(200, {
            data: [
                {
                    id: 1,
                    body: 'Ready for review.',
                },
            ],
        });

        const result = await listTaskComments(10);

        expect(result.data[0].body).toBe('Ready for review.');
    });

    test('creates a task comment', async () => {
        mock.onPost('/tasks/10/comments', {
            body: 'Ready for review.',
        }).reply(201, {
            data: {
                comment: {
                    id: 2,
                    body: 'Ready for review.',
                },
            },
        });

        const result = await createTaskComment(10, '  Ready for review.  ');

        expect(result.data.comment.id).toBe(2);
    });

    test('retrieves task activity', async () => {
        mock.onGet('/tasks/10/activity').reply(200, {
            data: {
                activity_logs: [],
                status_histories: [],
            },
        });

        const result = await getTaskActivity(10);

        expect(result.data.activity_logs).toEqual([]);
    });

    test('deletes a task', async () => {
        mock.onDelete('/tasks/10').reply(200, {
            message: 'Task deleted successfully.',
        });

        const result = await deleteTask(10);

        expect(result.message).toBe('Task deleted successfully.');
    });
});
