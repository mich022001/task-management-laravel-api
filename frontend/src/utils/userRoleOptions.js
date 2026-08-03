const adminRoleOptions = [
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
];

const managerRoleOptions = [
    {
        value: 'team_member',
        label: 'Team Member',
    },
];

export function getAssignableUserRoleOptions(currentUserRole) {
    if (currentUserRole === 'admin') {
        return adminRoleOptions;
    }

    if (currentUserRole === 'manager') {
        return managerRoleOptions;
    }

    return [];
}
