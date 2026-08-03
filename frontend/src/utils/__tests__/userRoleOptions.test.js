import { describe, expect, test } from 'vitest';

import { getAssignableUserRoleOptions } from '../userRoleOptions.js';

describe('assignable user role options', () => {
    test('allows an admin to assign every supported user role', () => {
        expect(getAssignableUserRoleOptions('admin')).toEqual([
            {
                value: 'admin',
                label: 'Admin',
            },
            {
                value: 'manager',
                label: 'Manager',
            },
            {
                value: 'team_member',
                label: 'Team Member',
            },
        ]);
    });

    test('allows a manager to assign only the Team Member role', () => {
        expect(getAssignableUserRoleOptions('manager')).toEqual([
            {
                value: 'team_member',
                label: 'Team Member',
            },
        ]);
    });

    test('does not expose assignable roles to a Team Member', () => {
        expect(getAssignableUserRoleOptions('team_member')).toEqual([]);
    });
});
