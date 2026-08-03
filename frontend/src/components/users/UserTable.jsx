import UserStatusBadge from './UserStatusBadge.jsx';

function formatRole(role) {
    if (!role) {
        return 'Unknown';
    }

    return role
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export default function UserTable({
    users,
    currentUserId,
    onEdit,
    onStatusChange,
    updatingUserId = null,
}) {
    return (
        <div className="table-container admin-table-container">
            <table className="task-table admin-table user-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th aria-label="User actions">Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {users.map((user) => {
                        const isCurrentUser = user.id === currentUserId;
                        const isUpdating = updatingUserId === user.id;

                        return (
                            <tr key={user.id}>
                                <td>
                                    <div className="user-table-identity">
                                        <strong
                                            className="user-table-name"
                                            title={user.name}
                                        >
                                            {user.name}
                                        </strong>

                                        {isCurrentUser ? (
                                            <span className="user-table-current">
                                                You
                                            </span>
                                        ) : null}
                                    </div>
                                </td>

                                <td>
                                    <span
                                        className="user-table-email"
                                        title={user.email}
                                    >
                                        {user.email}
                                    </span>
                                </td>

                                <td>
                                    <span className="user-role-label">
                                        {formatRole(user.role)}
                                    </span>
                                </td>

                                <td>
                                    <UserStatusBadge
                                        isActive={user.is_active}
                                    />
                                </td>

                                <td>
                                    <div className="admin-table-actions">
                                        <button
                                            type="button"
                                            className="table-action-button"
                                            onClick={() => onEdit(user)}
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            className={
                                                user.is_active
                                                    ? 'table-action-button table-action-button-danger'
                                                    : 'table-action-button table-action-button-success'
                                            }
                                            onClick={() =>
                                                onStatusChange(
                                                    user,
                                                    !user.is_active,
                                                )
                                            }
                                            disabled={
                                                isUpdating || isCurrentUser
                                            }
                                            title={
                                                isCurrentUser
                                                    ? 'You cannot change your own status.'
                                                    : undefined
                                            }
                                        >
                                            {isUpdating
                                                ? 'Updating...'
                                                : isCurrentUser
                                                  ? 'Current account'
                                                  : user.is_active
                                                    ? 'Deactivate'
                                                    : 'Activate'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
