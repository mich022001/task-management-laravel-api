export default function UserStatusBadge({ isActive }) {
    return (
        <span
            className={`user-status-badge ${
                isActive
                    ? 'user-status-badge-active'
                    : 'user-status-badge-inactive'
            }`}
        >
            {isActive ? 'Active' : 'Inactive'}
        </span>
    );
}
