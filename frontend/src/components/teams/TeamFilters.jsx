export default function TeamFilters({ filters, onChange, onSubmit, onReset }) {
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
            aria-label="Team filters"
            onSubmit={submitFilters}
        >
            <div className="task-filter-field task-filter-search">
                <label htmlFor="team-search">Search</label>

                <input
                    id="team-search"
                    name="search"
                    type="search"
                    placeholder="Search team name"
                    value={filters.search}
                    onChange={updateFilter}
                />
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
