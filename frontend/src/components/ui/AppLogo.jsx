import Icon from './Icon.jsx';

export default function AppLogo() {
    return (
        <div className="app-brand">
            <div className="app-brand-mark">
                <Icon name="clipboard" size={22} />
            </div>

            <div className="app-brand-copy">
                <strong>Task Management</strong>
                <span>Workspace</span>
            </div>
        </div>
    );
}
