import { useAuth } from '../../hooks/useAuth.js';
import Avatar from '../ui/Avatar.jsx';
import Icon from '../ui/Icon.jsx';

function getRoleLabel(role) {
    const labels = {
        admin: 'Administrator',
        manager: 'Manager',
        team_member: 'Team Member',
    };

    return labels[role] ?? role?.replaceAll('_', ' ') ?? '';
}

export default function SidebarProfile() {
    const { user, logout } = useAuth();

    return (
        <section
            className="sidebar-workspace"
            aria-label="Current workspace user"
        >
            <p className="sidebar-section-label">Workspace</p>

            <div className="sidebar-user">
                <Avatar name={user.name} size="large" />

                <div className="sidebar-user-copy">
                    <strong>{user.name}</strong>
                    <span>{getRoleLabel(user.role)}</span>
                </div>
            </div>

            <button
                type="button"
                className="sidebar-logout-button"
                onClick={logout}
            >
                <Icon name="logout" size={18} />
                <span>Log out</span>
            </button>
        </section>
    );
}
