const STATUS_OPTIONS = [
    {
        value: 'pending',
        label: 'Pending',
    },
    {
        value: 'in_progress',
        label: 'In Progress',
    },
    {
        value: 'completed',
        label: 'Completed',
    },
    {
        value: 'cancelled',
        label: 'Cancelled',
    },
];

const PRIORITY_OPTIONS = [
    {
        value: 'low',
        label: 'Low',
    },
    {
        value: 'medium',
        label: 'Medium',
    },
    {
        value: 'high',
        label: 'High',
    },
];

export default function TaskFilters({
    filters,
    teams,
    showTeamFilter,
    onChange,
    onSubmit,
    onReset,
}) {
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
            aria-label="Task filters"
            onSubmit={submitFilters}
        >
            <div className="task-filter-field task-filter-search">
                <label htmlFor="task-search">Search</label>

                <input
                    id="task-search"
                    name="search"
                    type="search"
                    placeholder="Search title or description"
                    value={filters.search}
                    onChange={updateFilter}
                />
            </div>

            <div className="task-filter-field">
                <label htmlFor="task-status">Status</label>

                <select
                    id="task-status"
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

            <div className="task-filter-field">
                <label htmlFor="task-priority">Priority</label>

                <select
                    id="task-priority"
                    name="priority"
                    value={filters.priority}
                    onChange={updateFilter}
                >
                    <option value="">All priorities</option>

                    {PRIORITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            {showTeamFilter ? (
                <div className="task-filter-field">
                    <label htmlFor="task-team">Team</label>

                    <select
                        id="task-team"
                        name="team_id"
                        value={filters.team_id}
                        onChange={updateFilter}
                    >
                        <option value="">All teams</option>

                        {teams.map((team) => (
                            <option key={team.id} value={String(team.id)}>
                                {team.name}
                            </option>
                        ))}
                    </select>
                </div>
            ) : null}

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
