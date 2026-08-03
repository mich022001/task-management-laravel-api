const ROLE_OPTIONS = [
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

const STATUS_OPTIONS = [
    {
        value: 'active',
        label: 'Active',
    },
    {
        value: 'inactive',
        label: 'Inactive',
    },
];

export default function UserFilters({ filters, onChange, onSubmit, onReset }) {
    function updateFilter(event) {
        onChange({
            ...filters,
            [event.target.name]: event.target.value,
        });
    }

    function submitFilters(event) {
        event.preventDefault();
        onSubmit();
    }

    return (
        <form
            className="task-filters"
            aria-label="User filters"
            onSubmit={submitFilters}
        >
            <div className="task-filter-field task-filter-search">
                <label htmlFor="user-search">Search</label>

                <input
                    id="user-search"
                    name="search"
                    type="search"
                    placeholder="Search name or email"
                    value={filters.search}
                    onChange={updateFilter}
                />
            </div>

            <div className="task-filter-field">
                <label htmlFor="user-role">Role</label>

                <select
                    id="user-role"
                    name="role"
                    value={filters.role}
                    onChange={updateFilter}
                >
                    <option value="">All roles</option>

                    {ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="task-filter-field">
                <label htmlFor="user-status">Status</label>

                <select
                    id="user-status"
                    name="status"
                    value={filters.status}
                    onChange={updateFilter}
                >
                    <option value="">All statuses</option>

                    {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="task-filter-actions">
                <button className="primary-button" type="submit">
                    Apply Filters
                </button>

                <button
                    className="secondary-button"
                    type="button"
                    onClick={onReset}
                >
                    Reset
                </button>
            </div>
        </form>
    );
}
