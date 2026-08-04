import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import EmptyState from '../components/common/EmptyState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import Loading from '../components/common/Loading.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import { useAuth } from '../hooks/useAuth.js';
import {
    getTaskSummary,
    getTeamHighlights,
    getTeamReport,
    getUpcomingDeadlines,
} from '../services/analytics.service.js';
import { listTeams } from '../services/team.service.js';

const DEFAULT_DEADLINE_DAYS = 7;

function getErrorMessage(error) {
    return (
        error.response?.data?.message ??
        error.message ??
        'Unable to load analytics.'
    );
}

function formatNumber(value) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return '0';
    }

    return numericValue.toLocaleString();
}

function formatPercentage(value) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return '0%';
    }

    return `${numericValue.toFixed(2).replace(/\.00$/, '')}%`;
}

function formatDays(value) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue === 0) {
        return 'No data';
    }

    const formattedValue = numericValue
        .toFixed(2)
        .replace(/\.00$/, '')
        .replace(/(\.\d)0$/, '$1');

    return `${formattedValue} ${numericValue === 1 ? 'day' : 'days'}`;
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
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

function formatPriority(priority) {
    if (!priority) {
        return 'Unknown';
    }

    return `${priority.charAt(0).toUpperCase()}${priority.slice(1)}`;
}

function PriorityMetric({ label, taskCount, averageDays, tone }) {
    return (
        <article
            className={`analytics-priority-card analytics-priority-${tone}`}
        >
            <div className="analytics-priority-heading">
                <span>{label}</span>
                <strong>{formatNumber(taskCount)}</strong>
            </div>

            <p>Assigned tasks</p>

            <dl>
                <div>
                    <dt>Average completion</dt>
                    <dd>{formatDays(averageDays)}</dd>
                </div>
            </dl>
        </article>
    );
}

function DeadlineList({ title, tasks, tone }) {
    return (
        <section className="analytics-panel">
            <header className="analytics-panel-header">
                <div>
                    <p className="analytics-panel-eyebrow">{title}</p>
                    <h3>{formatNumber(tasks.length)} tasks</h3>
                </div>
            </header>

            {tasks.length === 0 ? (
                <div className="analytics-empty-message">
                    No {title.toLowerCase()}.
                </div>
            ) : (
                <div className="analytics-deadline-list">
                    {tasks.map((task) => (
                        <Link
                            key={task.id}
                            to={`/tasks/${task.id}`}
                            className="analytics-deadline-item"
                        >
                            <span
                                className={`analytics-deadline-marker analytics-deadline-marker-${tone}`}
                            />

                            <div className="analytics-deadline-copy">
                                <strong>{task.title}</strong>

                                <span>
                                    {formatPriority(task.priority)} priority
                                </span>
                            </div>

                            <time dateTime={task.due_date}>
                                {formatDate(task.due_date)}
                            </time>
                        </Link>
                    ))}
                </div>
            )}
        </section>
    );
}

function MemberProductivityTable({ members }) {
    if (members.length === 0) {
        return (
            <EmptyState
                title="No team members"
                description="This team has no members available for productivity analysis."
            />
        );
    }

    return (
        <div className="table-container analytics-table-container">
            <table className="task-table analytics-member-table">
                <thead>
                    <tr>
                        <th>Team member</th>
                        <th>Assigned</th>
                        <th>Completed</th>
                        <th>Completion rate</th>
                        <th>Priority workload</th>
                        <th>Average completion</th>
                    </tr>
                </thead>

                <tbody>
                    {members.map((member) => (
                        <tr key={member.user_id}>
                            <td>
                                <div className="analytics-member-identity">
                                    <strong>{member.name}</strong>
                                    <span>{member.email}</span>
                                </div>
                            </td>

                            <td>{formatNumber(member.assigned_tasks)}</td>

                            <td>{formatNumber(member.completed_tasks)}</td>

                            <td>
                                <span className="analytics-rate">
                                    {formatPercentage(member.completion_rate)}
                                </span>
                            </td>

                            <td>
                                <div className="analytics-priority-badges">
                                    <span className="analytics-priority-badge analytics-priority-badge-low">
                                        Low {formatNumber(member.priority?.low)}
                                    </span>

                                    <span className="analytics-priority-badge analytics-priority-badge-medium">
                                        Medium{' '}
                                        {formatNumber(member.priority?.medium)}
                                    </span>

                                    <span className="analytics-priority-badge analytics-priority-badge-high">
                                        High{' '}
                                        {formatNumber(member.priority?.high)}
                                    </span>
                                </div>
                            </td>

                            <td>
                                <div className="analytics-duration-cell">
                                    <strong>
                                        {formatDays(
                                            member.average_completion_days,
                                        )}
                                    </strong>

                                    <span>
                                        L:{' '}
                                        {formatDays(
                                            member
                                                .average_completion_days_by_priority
                                                ?.low,
                                        )}{' '}
                                        · M:{' '}
                                        {formatDays(
                                            member
                                                .average_completion_days_by_priority
                                                ?.medium,
                                        )}{' '}
                                        · H:{' '}
                                        {formatDays(
                                            member
                                                .average_completion_days_by_priority
                                                ?.high,
                                        )}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function TeamHighlightsTable({ teams, selectedTeamId, onSelectTeam }) {
    if (teams.length === 0) {
        return (
            <EmptyState
                title="No team analytics"
                description="No teams are currently available for analytics."
            />
        );
    }

    return (
        <div className="table-container analytics-table-container">
            <table className="task-table analytics-team-summary-table">
                <colgroup>
                    <col className="analytics-col-team" />
                    <col className="analytics-col-members" />
                    <col className="analytics-col-total" />

                    <col className="analytics-col-status" />
                    <col className="analytics-col-status" />
                    <col className="analytics-col-status" />
                    <col className="analytics-col-status" />
                    <col className="analytics-col-status" />

                    <col className="analytics-col-priority" />
                    <col className="analytics-col-priority" />
                    <col className="analytics-col-priority" />

                    <col className="analytics-col-risk" />
                    <col className="analytics-col-risk" />
                    <col className="analytics-col-risk" />

                    <col className="analytics-col-completion" />
                    <col className="analytics-col-average" />
                </colgroup>

                <thead>
                    <tr>
                        <th rowSpan="2">Team</th>
                        <th rowSpan="2">Members</th>
                        <th rowSpan="2">Total</th>
                        <th colSpan="5">Task status</th>
                        <th colSpan="3">Priority</th>
                        <th colSpan="3">High-priority risk</th>
                        <th rowSpan="2">Completion</th>
                        <th rowSpan="2">Avg. completion</th>
                    </tr>

                    <tr>
                        <th>
                            Yet to
                            <br />
                            start
                        </th>
                        <th>
                            In
                            <br />
                            progress
                        </th>
                        <th>Completed</th>
                        <th>Overdue</th>
                        <th>Cancelled</th>

                        <th>Low</th>
                        <th>Medium</th>
                        <th>High</th>

                        <th>
                            Yet to
                            <br />
                            start
                        </th>
                        <th>
                            In
                            <br />
                            progress
                        </th>
                        <th>Overdue</th>
                    </tr>
                </thead>

                <tbody>
                    {teams.map((team) => (
                        <tr
                            key={team.team_id}
                            className={
                                team.team_id === selectedTeamId
                                    ? 'analytics-selected-row'
                                    : ''
                            }
                            onClick={() => onSelectTeam(team.team_id)}
                        >
                            <td>
                                <strong>{team.team_name}</strong>
                            </td>

                            <td>{formatNumber(team.member_count)}</td>
                            <td>{formatNumber(team.total_tasks)}</td>

                            <td>{formatNumber(team.status?.yet_to_start)}</td>

                            <td>{formatNumber(team.status?.in_progress)}</td>

                            <td>{formatNumber(team.status?.completed)}</td>

                            <td>{formatNumber(team.overdue_tasks)}</td>

                            <td>{formatNumber(team.status?.cancelled)}</td>

                            <td>{formatNumber(team.priority?.low)}</td>
                            <td>{formatNumber(team.priority?.medium)}</td>
                            <td>{formatNumber(team.priority?.high)}</td>

                            <td>
                                {formatNumber(team.high_priority?.yet_to_start)}
                            </td>

                            <td>
                                {formatNumber(team.high_priority?.in_progress)}
                            </td>

                            <td>{formatNumber(team.high_priority?.overdue)}</td>

                            <td>{formatPercentage(team.completion_rate)}</td>

                            <td>{formatDays(team.average_completion_days)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function normalizeReportMembers(members = []) {
    return members.map((member) => {
        const summary = member.summary ?? {};

        return {
            user_id: member.user_id,
            name: member.name,
            email: member.email,
            member_role: member.member_role,
            assigned_tasks: summary.assigned_tasks ?? 0,
            completed_tasks: summary.completed_tasks ?? 0,
            completion_rate: summary.completion_rate ?? 0,
            priority: summary.priority ?? {
                low: 0,
                medium: 0,
                high: 0,
            },
            average_completion_days: summary.average_completion_days ?? 0,
            average_completion_days_by_priority:
                summary.average_completion_days_by_priority ?? {
                    low: 0,
                    medium: 0,
                    high: 0,
                },
        };
    });
}

export default function Analytics() {
    const { user } = useAuth();

    const [teams, setTeams] = useState([]);
    const [teamHighlights, setTeamHighlights] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [teamMembers, setTeamMembers] = useState([]);
    const [teamReport, setTeamReport] = useState(null);
    const [taskSummary, setTaskSummary] = useState(null);
    const [deadlines, setDeadlines] = useState({
        upcoming: [],
        overdue: [],
        range_days: DEFAULT_DEADLINE_DAYS,
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const canViewTeamAnalytics =
        user.role === 'admin' || user.role === 'manager';

    const loadTeamReport = useCallback(
        async ({ teamId, memberId = '', preserveMembers = false }) => {
            if (!teamId) {
                setTeamMembers([]);
                setTeamReport(null);
                setTaskSummary(null);
                setDeadlines({
                    upcoming: [],
                    overdue: [],
                    range_days: DEFAULT_DEADLINE_DAYS,
                });

                return;
            }

            const response = await getTeamReport(
                teamId,
                memberId
                    ? {
                          member_ids: memberId,
                      }
                    : {},
            );

            const report = response.data ?? null;
            const normalizedMembers = normalizeReportMembers(
                report?.members ?? [],
            );

            if (!preserveMembers) {
                setTeamMembers(normalizedMembers);
            }

            setTeamReport(report);
            setTaskSummary(report?.summary ?? null);
            setDeadlines(
                report?.deadlines ?? {
                    upcoming: [],
                    overdue: [],
                    range_days: DEFAULT_DEADLINE_DAYS,
                },
            );

            return report;
        },
        [],
    );

    const loadAnalytics = useCallback(
        async ({ teamId = '', refresh = false } = {}) => {
            if (refresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }

            setErrorMessage('');

            try {
                /*
                 * Admins and managers use one unified endpoint.
                 * This prevents duplicate Laravel task queries and timeouts.
                 */
                if (canViewTeamAnalytics) {
                    await loadTeamReport({
                        teamId,
                    });

                    return;
                }

                /*
                 * Team members retain their personal analytics endpoints.
                 */
                const [summaryResponse, deadlineResponse] = await Promise.all([
                    getTaskSummary({}),
                    getUpcomingDeadlines({
                        days: DEFAULT_DEADLINE_DAYS,
                    }),
                ]);

                setTaskSummary(summaryResponse.data);
                setDeadlines(deadlineResponse.data);
                setTeamReport(null);
            } catch (error) {
                setErrorMessage(getErrorMessage(error));
            } finally {
                setIsLoading(false);
                setIsRefreshing(false);
            }
        },
        [canViewTeamAnalytics, loadTeamReport],
    );

    useEffect(() => {
        const initializationId = window.setTimeout(async () => {
            try {
                if (!canViewTeamAnalytics) {
                    await loadAnalytics();

                    return;
                }

                /*
                 * Load teams independently because this request controls
                 * the team selector and the initial analytics scope.
                 *
                 * Team highlights are supplemental and must not prevent
                 * the rest of the analytics page from loading.
                 */
                const teamResponse = await listTeams({
                    page: 1,
                    per_page: 100,
                });

                const availableTeams = teamResponse.data ?? [];

                setTeams(availableTeams);

                const initialTeamId = availableTeams[0]?.id ?? '';

                setSelectedTeamId(initialTeamId);
                setSelectedMemberId('');

                /*
                 * Do not await this request. A timeout or backend failure
                 * must not discard the successfully loaded team list.
                 */
                void getTeamHighlights()
                    .then((highlightResponse) => {
                        setTeamHighlights(highlightResponse.data?.teams ?? []);
                    })
                    .catch((error) => {
                        console.error('Unable to load team highlights.', error);

                        setTeamHighlights([]);
                    });

                await loadAnalytics({
                    teamId: initialTeamId,
                });
            } catch (error) {
                setErrorMessage(getErrorMessage(error));
                setIsLoading(false);
            }
        }, 0);

        return () => {
            window.clearTimeout(initializationId);
        };
    }, [canViewTeamAnalytics, loadAnalytics]);

    const selectedTeam = useMemo(
        () => teams.find((team) => team.id === selectedTeamId) ?? null,
        [selectedTeamId, teams],
    );

    async function handleTeamChange(event) {
        const teamId = event.target.value;

        setSelectedTeamId(teamId);
        setSelectedMemberId('');
        setTeamMembers([]);
        setTeamReport(null);

        if (!teamId) {
            return;
        }

        setIsRefreshing(true);
        setErrorMessage('');

        try {
            await loadAnalytics({
                teamId,
            });
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsRefreshing(false);
        }
    }

    async function handleMemberChange(event) {
        const memberId = event.target.value;

        setSelectedMemberId(memberId);
        setIsRefreshing(true);
        setErrorMessage('');

        try {
            await loadTeamReport({
                teamId: selectedTeamId,
                memberId,
                preserveMembers: true,
            });
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsRefreshing(false);
        }
    }

    async function handleTeamRowSelection(teamId) {
        setSelectedTeamId(teamId);
        setSelectedMemberId('');
        setTeamMembers([]);
        setTeamReport(null);

        setIsRefreshing(true);
        setErrorMessage('');

        try {
            await loadAnalytics({
                teamId,
            });
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsRefreshing(false);
        }
    }

    if (isLoading) {
        return (
            <Loading
                title="Loading analytics"
                description="Calculating workload, completion rates, and deadline metrics."
            />
        );
    }

    if (errorMessage && !taskSummary) {
        return (
            <ErrorState
                title="Unable to load analytics"
                description={errorMessage}
                onRetry={() =>
                    loadAnalytics({
                        teamId: selectedTeamId,
                    })
                }
            />
        );
    }

    const summary = taskSummary ?? {};
    const priorityCounts = summary.priority ?? {
        low: 0,
        medium: 0,
        high: 0,
    };

    const priorityDurations = summary.average_completion_days_by_priority ?? {};

    return (
        <section className="analytics-page">
            <PageHeader
                eyebrow="Performance insights"
                title="Analytics"
                description="Review task workload, priorities, completion speed, team productivity, and approaching deadlines."
                actions={
                    <div className="analytics-header-actions">
                        {canViewTeamAnalytics ? (
                            <>
                                <label className="analytics-team-filter">
                                    <span>Team</span>

                                    <select
                                        value={selectedTeamId}
                                        onChange={handleTeamChange}
                                        disabled={
                                            isRefreshing || teams.length === 0
                                        }
                                    >
                                        {teams.length === 0 ? (
                                            <option value="">
                                                No available teams
                                            </option>
                                        ) : null}

                                        {teams.map((team) => (
                                            <option
                                                key={team.id}
                                                value={team.id}
                                            >
                                                {team.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="analytics-team-filter">
                                    <span>Member</span>

                                    <select
                                        value={selectedMemberId}
                                        onChange={handleMemberChange}
                                        disabled={
                                            isRefreshing ||
                                            !selectedTeamId ||
                                            teamMembers.length === 0
                                        }
                                    >
                                        <option value="">All members</option>

                                        {teamMembers.map((member) => (
                                            <option
                                                key={member.user_id}
                                                value={member.user_id}
                                            >
                                                {member.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </>
                        ) : null}

                        <button
                            type="button"
                            className="secondary-button"
                            disabled={isRefreshing}
                            onClick={() =>
                                loadAnalytics({
                                    teamId: selectedTeamId,
                                    refresh: true,
                                })
                            }
                        >
                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>
                }
            />

            {errorMessage ? (
                <div className="status-error-notification" role="alert">
                    {errorMessage}
                </div>
            ) : null}

            {selectedTeam ? (
                <div className="analytics-scope-banner">
                    <span>Current team</span>
                    <strong>{selectedTeam.name}</strong>
                </div>
            ) : null}

            <section className="analytics-section">
                <header className="analytics-section-header">
                    <div>
                        <p className="analytics-section-eyebrow">
                            Team highlights
                        </p>

                        <h2>Team workload, priority, and risk summary</h2>

                        <p>
                            Compare every authorized team by task status,
                            priority, high-priority risk, and completion
                            performance.
                        </p>
                    </div>
                </header>

                <TeamHighlightsTable
                    teams={teamHighlights}
                    selectedTeamId={selectedTeamId}
                    onSelectTeam={handleTeamRowSelection}
                />
            </section>

            <div className="stat-grid analytics-stat-grid">
                <StatCard
                    title="Total tasks"
                    value={formatNumber(summary.total_tasks)}
                    description="All tasks in the current analytics scope."
                    icon="tasks"
                    tone="primary"
                />

                <StatCard
                    title="Completion rate"
                    value={formatPercentage(summary.completion_rate)}
                    description={`${formatNumber(summary.completed_tasks)} tasks completed.`}
                    icon="check"
                    tone="success"
                />

                <StatCard
                    title="In progress"
                    value={formatNumber(
                        summary.in_progress_tasks ??
                            taskSummary?.status?.in_progress,
                    )}
                    description="Tasks currently being worked on."
                    icon="progress"
                    tone="primary"
                />

                <StatCard
                    title="Overdue"
                    value={formatNumber(summary.overdue_tasks)}
                    description="Incomplete tasks beyond their due date."
                    icon="alert"
                    tone="danger"
                />

                <StatCard
                    title="Average completion"
                    value={formatDays(summary.average_completion_days)}
                    description="Average elapsed time from creation to completion."
                    icon="clock"
                    tone="neutral"
                />
            </div>

            <section className="analytics-section">
                <header className="analytics-section-header">
                    <div>
                        <p className="analytics-section-eyebrow">
                            Workload composition
                        </p>
                        <h3>Task priority and completion speed</h3>
                        <p>
                            Compare assigned workload and average completion
                            duration for each priority level.
                        </p>
                    </div>
                </header>

                <div className="analytics-priority-grid">
                    <PriorityMetric
                        label="Low priority"
                        taskCount={priorityCounts.low}
                        averageDays={priorityDurations.low}
                        tone="low"
                    />

                    <PriorityMetric
                        label="Medium priority"
                        taskCount={priorityCounts.medium}
                        averageDays={priorityDurations.medium}
                        tone="medium"
                    />

                    <PriorityMetric
                        label="High priority"
                        taskCount={priorityCounts.high}
                        averageDays={priorityDurations.high}
                        tone="high"
                    />
                </div>
            </section>

            {canViewTeamAnalytics && selectedTeamId ? (
                <section className="analytics-section">
                    <header className="analytics-section-header">
                        <div>
                            <p className="analytics-section-eyebrow">
                                Team productivity
                            </p>
                            <h3>Member workload and completion performance</h3>
                            <p>
                                Workload counts include every assigned task.
                                Completion duration only includes valid
                                completed tasks.
                            </p>
                        </div>
                    </header>

                    <MemberProductivityTable
                        members={normalizeReportMembers(
                            teamReport?.members ?? [],
                        )}
                    />
                </section>
            ) : null}

            <section className="analytics-section">
                <header className="analytics-section-header">
                    <div>
                        <p className="analytics-section-eyebrow">
                            Deadline monitoring
                        </p>
                        <h3>Upcoming and overdue tasks</h3>
                        <p>
                            Tasks due within the next{' '}
                            {deadlines.range_days ?? DEFAULT_DEADLINE_DAYS}{' '}
                            days.
                        </p>
                    </div>
                </header>

                <div className="analytics-deadline-grid">
                    <DeadlineList
                        title="Overdue"
                        tasks={deadlines.overdue ?? []}
                        tone="danger"
                    />

                    <DeadlineList
                        title="Upcoming"
                        tasks={deadlines.upcoming ?? []}
                        tone="primary"
                    />
                </div>
            </section>
        </section>
    );
}
