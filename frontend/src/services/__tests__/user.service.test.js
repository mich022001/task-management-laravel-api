import { beforeEach, describe, expect, test, vi } from 'vitest';

import laravelClient from '../../api/laravelClient.js';
import {
    createUser,
    getUser,
    listUsers,
    updateUser,
    updateUserStatus,
} from '../user.service.js';

vi.mock('../../api/laravelClient.js', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
    },
}));

describe('user service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('lists users with query parameters', async () => {
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
            search: 'michael',
            role: 'manager',
            status: 'active',
            page: 1,
        };

        const response = await listUsers(parameters);

        expect(laravelClient.get).toHaveBeenCalledWith('/users', {
            params: parameters,
        });

        expect(response).toEqual(payload);
    });

    test('retrieves a user by UUID', async () => {
        const payload = {
            data: {
                user: {
                    id: 'user-uuid',
                    name: 'Michael Valenzuela',
                },
            },
        };

        laravelClient.get.mockResolvedValue({
            data: payload,
        });

        const response = await getUser('user-uuid');

        expect(laravelClient.get).toHaveBeenCalledWith('/users/user-uuid');

        expect(response).toEqual(payload);
    });

    test('creates a user', async () => {
        const credentials = {
            name: 'Team Member',
            email: 'member@test.com',
            password: 'password123',
            role: 'team_member',
            is_active: true,
        };

        const payload = {
            data: {
                user: {
                    id: 'new-user-uuid',
                    ...credentials,
                },
            },
        };

        laravelClient.post.mockResolvedValue({
            data: payload,
        });

        const response = await createUser(credentials);

        expect(laravelClient.post).toHaveBeenCalledWith('/users', credentials);

        expect(response).toEqual(payload);
    });

    test('updates a user', async () => {
        const credentials = {
            name: 'Updated Name',
            role: 'manager',
        };

        const payload = {
            data: {
                user: {
                    id: 'user-uuid',
                    ...credentials,
                },
            },
        };

        laravelClient.patch.mockResolvedValue({
            data: payload,
        });

        const response = await updateUser('user-uuid', credentials);

        expect(laravelClient.patch).toHaveBeenCalledWith(
            '/users/user-uuid',
            credentials,
        );

        expect(response).toEqual(payload);
    });

    test('updates user active status', async () => {
        const payload = {
            data: {
                user: {
                    id: 'user-uuid',
                    is_active: false,
                },
            },
        };

        laravelClient.patch.mockResolvedValue({
            data: payload,
        });

        const response = await updateUserStatus('user-uuid', false);

        expect(laravelClient.patch).toHaveBeenCalledWith(
            '/users/user-uuid/status',
            {
                is_active: false,
            },
        );

        expect(response).toEqual(payload);
    });
});
