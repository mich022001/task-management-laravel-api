function formatPlatformRole(role) {
    if (!role) {
        return 'Unknown';
    }

    return role
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function formatMemberRole(role) {
    return role === 'lead' ? 'Lead' : 'Member';
}

export default function TeamMemberTable({
    members,
    creatorId,
    canManageMembers,
    updatingMemberId,
    removingMemberId,
    onRoleChange,
    onRemove,
}) {
    return (
        <div className="table-container admin-table-container">
            <table className="task-table admin-table team-members-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Account Role</th>
                        <th>Team Role</th>
                        <th>Status</th>

                        {canManageMembers ? (
                            <th aria-label="Member actions">Actions</th>
                        ) : null}
                    </tr>
                </thead>

                <tbody>
                    {members.map((member) => {
                        const isCreator = member.id === creatorId;
                        const isUpdating = updatingMemberId === member.id;
                        const isRemoving = removingMemberId === member.id;

                        return (
                            <tr key={member.id}>
                                <td>
                                    <div className="user-table-identity">
                                        <strong
                                            className="user-table-name"
                                            title={member.name}
                                        >
                                            {member.name}
                                        </strong>

                                        {isCreator ? (
                                            <span className="user-table-current">
                                                Creator
                                            </span>
                                        ) : null}
                                    </div>
                                </td>

                                <td>
                                    <span
                                        className="user-table-email"
                                        title={member.email}
                                    >
                                        {member.email}
                                    </span>
                                </td>

                                <td>{formatPlatformRole(member.role)}</td>

                                <td>
                                    {canManageMembers ? (
                                        <select
                                            className="team-member-role-select"
                                            aria-label={`Team role for ${member.name}`}
                                            value={
                                                member.member_role ?? 'member'
                                            }
                                            disabled={isUpdating || isRemoving}
                                            onChange={(event) =>
                                                onRoleChange(
                                                    member,
                                                    event.target.value,
                                                )
                                            }
                                        >
                                            <option value="member">
                                                Member
                                            </option>

                                            {member.role === 'manager' ? (
                                                <option value="lead">
                                                    Lead
                                                </option>
                                            ) : null}
                                        </select>
                                    ) : (
                                        formatMemberRole(member.member_role)
                                    )}
                                </td>

                                <td>
                                    <span
                                        className={`user-status-badge ${
                                            member.is_active
                                                ? 'user-status-badge-active'
                                                : 'user-status-badge-inactive'
                                        }`}
                                    >
                                        {member.is_active
                                            ? 'Active'
                                            : 'Inactive'}
                                    </span>
                                </td>

                                {canManageMembers ? (
                                    <td>
                                        {isCreator ? (
                                            <span className="muted-text">
                                                Protected
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                className="table-action-button table-action-button-danger"
                                                disabled={
                                                    isRemoving || isUpdating
                                                }
                                                onClick={() => onRemove(member)}
                                            >
                                                {isRemoving
                                                    ? 'Removing...'
                                                    : 'Remove'}
                                            </button>
                                        )}
                                    </td>
                                ) : null}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
