export default function TeamTable({ teams, onView }) {
    return (
        <div className="table-container admin-table-container">
            <table className="task-table admin-table team-table">
                <thead>
                    <tr>
                        <th>Team</th>
                        <th>Creator</th>
                        <th>Members</th>
                        <th>Tasks</th>
                        <th aria-label="Team actions">Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {teams.map((team) => (
                        <tr key={team.id}>
                            <td>
                                <strong
                                    className="team-table-name"
                                    title={team.name}
                                >
                                    {team.name}
                                </strong>
                            </td>

                            <td>
                                <span
                                    className="team-table-creator"
                                    title={team.creator?.name ?? 'Unknown'}
                                >
                                    {team.creator?.name ?? 'Unknown'}
                                </span>
                            </td>

                            <td>{team.members_count ?? 0}</td>

                            <td>{team.tasks_count ?? 0}</td>

                            <td>
                                <button
                                    type="button"
                                    className="table-action-button"
                                    onClick={() => onView(team)}
                                >
                                    View
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
