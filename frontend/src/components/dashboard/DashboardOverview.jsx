function formatLabel(value) {
    return String(value ?? '')
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value) {
    if (!value) {
        return 'No due date';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Invalid date';
    }

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
}

function StatusOverview({ summary }) {
    const status = summary?.status ?? {};

    const items = [
        {
            key: 'pending',
            label: 'Pending',
            value: status.pending ?? 0,
        },
        {
            key: 'in_progress',
            label: 'In Progress',
            value: status.in_progress ?? 0,
        },
        {
            key: 'completed',
            label: 'Completed',
            value: status.completed ?? 0,
        },
        {
            key: 'cancelled',
            label: 'Cancelled',
            value: status.cancelled ?? 0,
        },
    ];

    const total = items.reduce((sum, item) => sum + item.value, 0);

    const completedPercentage =
        total > 0 ? ((status.completed ?? 0) / total) * 100 : 0;

    return (
        <article className="dashboard-panel dashboard-status-panel">
            <div className="dashboard-panel-heading">
                <div>
                    <p className="dashboard-panel-eyebrow">Task distribution</p>
                    <h3>Task Status Overview</h3>
                </div>

                <span className="dashboard-panel-total">{total} tasks</span>
            </div>

            <div className="dashboard-status-content">
                <div
                    className="dashboard-donut"
                    style={{
                        '--dashboard-completed-percentage': `${completedPercentage}%`,
                    }}
                    role="img"
                    aria-label={`${status.completed ?? 0} of ${total} tasks completed`}
                >
                    <div className="dashboard-donut-center">
                        <strong>{summary?.completion_rate ?? 0}%</strong>
                        <span>completed</span>
                    </div>
                </div>

                <ul className="dashboard-chart-legend">
                    {items.map((item) => (
                        <li key={item.key}>
                            <span
                                className={`dashboard-legend-dot dashboard-legend-${item.key}`}
                            />

                            <span>{item.label}</span>
                            <strong>{item.value}</strong>
                        </li>
                    ))}
                </ul>
            </div>
        </article>
    );
}

function PriorityDistribution({ summary }) {
    const priority = summary?.priority ?? {};

    const items = [
        {
            key: 'high',
            label: 'High',
            value: priority.high ?? 0,
        },
        {
            key: 'medium',
            label: 'Medium',
            value: priority.medium ?? 0,
        },
        {
            key: 'low',
            label: 'Low',
            value: priority.low ?? 0,
        },
    ];

    const maximum = Math.max(...items.map((item) => item.value), 1);

    return (
        <article className="dashboard-panel">
            <div className="dashboard-panel-heading">
                <div>
                    <p className="dashboard-panel-eyebrow">Work urgency</p>
                    <h3>Priority Distribution</h3>
                </div>
            </div>

            <div className="dashboard-priority-list">
                {items.map((item) => {
                    const percentage = (item.value / maximum) * 100;

                    return (
                        <div className="dashboard-priority-row" key={item.key}>
                            <div className="dashboard-priority-label">
                                <span>{item.label}</span>
                                <strong>{item.value}</strong>
                            </div>

                            <div
                                className="dashboard-priority-track"
                                aria-label={`${item.label} priority: ${item.value}`}
                            >
                                <span
                                    className={`dashboard-priority-fill dashboard-priority-${item.key}`}
                                    style={{
                                        width: `${percentage}%`,
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </article>
    );
}

function DeadlineList({ deadlines }) {
    const upcoming = deadlines?.upcoming ?? [];
    const overdue = deadlines?.overdue ?? [];

    const items = [
        ...overdue.map((task) => ({
            ...task,
            deadlineType: 'overdue',
        })),
        ...upcoming.map((task) => ({
            ...task,
            deadlineType: 'upcoming',
        })),
    ].slice(0, 6);

    return (
        <article className="dashboard-panel">
            <div className="dashboard-panel-heading">
                <div>
                    <p className="dashboard-panel-eyebrow">
                        Next {deadlines?.range_days ?? 7} days
                    </p>
                    <h3>Deadlines</h3>
                </div>

                <span className="dashboard-panel-total">
                    {overdue.length} overdue
                </span>
            </div>

            {items.length === 0 ? (
                <div className="dashboard-empty-state">
                    <p>No overdue or upcoming deadlines.</p>
                </div>
            ) : (
                <ul className="dashboard-deadline-list">
                    {items.map((task) => (
                        <li key={`${task.deadlineType}-${task.id}`}>
                            <div className="dashboard-deadline-details">
                                <strong>{task.title}</strong>

                                <div className="dashboard-deadline-meta">
                                    <span
                                        className={`status-badge status-${task.status}`}
                                    >
                                        {formatLabel(task.status)}
                                    </span>

                                    <span
                                        className={`priority-badge priority-${task.priority}`}
                                    >
                                        {formatLabel(task.priority)}
                                    </span>
                                </div>
                            </div>

                            <div className="dashboard-deadline-date">
                                <span
                                    className={`dashboard-deadline-type dashboard-deadline-${task.deadlineType}`}
                                >
                                    {formatLabel(task.deadlineType)}
                                </span>

                                <time dateTime={task.due_date ?? undefined}>
                                    {formatDate(task.due_date)}
                                </time>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </article>
    );
}

function TeamWorkload({ teamHighlights }) {
    const teams = teamHighlights?.teams ?? [];

    if (teams.length === 0) {
        return null;
    }

    const visibleTeams = [...teams]
        .sort((firstTeam, secondTeam) => {
            return secondTeam.total_tasks - firstTeam.total_tasks;
        })
        .slice(0, 6);

    const maximumTasks = Math.max(
        ...visibleTeams.map((team) => team.total_tasks),
        1,
    );

    return (
        <article className="dashboard-panel dashboard-team-panel">
            <div className="dashboard-panel-heading">
                <div>
                    <p className="dashboard-panel-eyebrow">Authorized teams</p>
                    <h3>Team Workload</h3>
                </div>

                <span className="dashboard-panel-total">
                    {teamHighlights?.totals?.teams ?? teams.length} teams
                </span>
            </div>

            <div className="dashboard-team-list">
                {visibleTeams.map((team) => {
                    const workloadPercentage =
                        (team.total_tasks / maximumTasks) * 100;

                    return (
                        <div className="dashboard-team-row" key={team.team_id}>
                            <div className="dashboard-team-heading">
                                <div>
                                    <strong>{team.team_name}</strong>

                                    <span>
                                        {team.member_count} members ·{' '}
                                        {team.completion_rate}% completed
                                    </span>
                                </div>

                                <strong>{team.total_tasks} tasks</strong>
                            </div>

                            <div
                                className="dashboard-team-track"
                                aria-label={`${team.team_name}: ${team.total_tasks} tasks`}
                            >
                                <span
                                    style={{
                                        width: `${workloadPercentage}%`,
                                    }}
                                />
                            </div>

                            <div className="dashboard-team-metrics">
                                <span>
                                    {team.status?.in_progress ?? 0} in progress
                                </span>
                                <span>{team.overdue_tasks ?? 0} overdue</span>
                                <span>
                                    {team.priority?.high ?? 0} high priority
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </article>
    );
}

export default function DashboardOverview({
    summary,
    deadlines,
    teamHighlights,
}) {
    return (
        <section
            className="dashboard-overview"
            aria-label="Dashboard analytics overview"
        >
            <div className="dashboard-overview-grid">
                <StatusOverview summary={summary} />
                <PriorityDistribution summary={summary} />
                <DeadlineList deadlines={deadlines} />
            </div>

            <TeamWorkload teamHighlights={teamHighlights} />
        </section>
    );
}
