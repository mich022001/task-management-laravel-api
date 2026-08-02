import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import EmptyState from '../components/common/EmptyState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import Loading from '../components/common/Loading.jsx';
import TaskPriorityBadge from '../components/tasks/TaskPriorityBadge.jsx';
import TaskStatusBadge from '../components/tasks/TaskStatusBadge.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { useAuth } from '../hooks/useAuth.js';
import {
    createTaskComment,
    getTask,
    getTaskActivity,
    listTaskComments,
    updateTaskStatus,
} from '../services/task.service.js';

const STATUS_LABELS = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

function getStatusLabel(status) {
    return STATUS_LABELS[status] ?? status?.replaceAll('_', ' ') ?? '';
}

function formatDate(value, includeTime = false) {
    if (!value) {
        return 'Not set';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Invalid date';
    }

    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        ...(includeTime
            ? {
                  timeStyle: 'short',
              }
            : {}),
    }).format(date);
}

function getErrorMessage(error, fallback) {
    const validationErrors = error.response?.data?.errors;

    if (validationErrors && typeof validationErrors === 'object') {
        const firstError = Object.values(validationErrors).flat().find(Boolean);

        if (firstError) {
            return String(firstError);
        }
    }

    return error.response?.data?.message ?? fallback;
}

function normalizeSearchValue(value) {
    return String(value ?? '')
        .trim()
        .toLocaleLowerCase();
}

function getDateInputValue(value) {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function getActivityActionLabel(action) {
    const labels = {
        comment_added: 'Comment added',
        status_changed: 'Status changed',
        task_created: 'Task created',
        task_updated: 'Task updated',
        task_deleted: 'Task deleted',
    };

    return (
        labels[action] ??
        String(action ?? '')
            .replaceAll('_', ' ')
            .replace(/\b\w/g, (character) => character.toUpperCase())
    );
}

export default function TaskDetails() {
    const { taskId } = useParams();
    const { user } = useAuth();

    const canAttemptActivity =
        user?.role === 'admin' || user?.role === 'manager';

    const [task, setTask] = useState(null);
    const [comments, setComments] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);
    const [statusHistories, setStatusHistories] = useState([]);

    const [selectedStatus, setSelectedStatus] = useState('');
    const [transitionNote, setTransitionNote] = useState('');
    const [commentBody, setCommentBody] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isAddingComment, setIsAddingComment] = useState(false);

    const [pageError, setPageError] = useState('');
    const [statusError, setStatusError] = useState('');
    const [commentError, setCommentError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [canViewActivity, setCanViewActivity] = useState(false);

    const [commentSearch, setCommentSearch] = useState('');
    const [commentDate, setCommentDate] = useState('');

    const [activitySearch, setActivitySearch] = useState('');
    const [activityActor, setActivityActor] = useState('');
    const [activityType, setActivityType] = useState('');
    const [activityDate, setActivityDate] = useState('');

    const filteredComments = useMemo(() => {
        const normalizedSearch = normalizeSearchValue(commentSearch);

        return comments.filter((comment) => {
            const matchesSearch =
                !normalizedSearch ||
                normalizeSearchValue(comment.body).includes(normalizedSearch) ||
                normalizeSearchValue(comment.user?.name).includes(
                    normalizedSearch,
                );

            const matchesDate =
                !commentDate ||
                getDateInputValue(comment.created_at) === commentDate;

            return matchesSearch && matchesDate;
        });
    }, [commentDate, commentSearch, comments]);

    const activityEntries = useMemo(() => {
        const standardActivities = activityLogs.map((activity) => ({
            id: `activity-${activity.id}`,
            source: 'activity',
            type: activity.action ?? 'activity',
            typeLabel: getActivityActionLabel(activity.action),
            description: activity.description,
            actorName: activity.actor?.name ?? 'Unknown user',
            createdAt: activity.created_at,
            note: '',
        }));

        const statusActivities = statusHistories.map((history) => ({
            id: `status-${history.id}`,
            source: 'status',
            type: 'status_changed',
            typeLabel: 'Status changed',
            description: `Status changed from ${getStatusLabel(
                history.previous_status,
            )} to ${getStatusLabel(history.new_status)}`,
            actorName: history.changed_by?.name ?? 'Unknown user',
            createdAt: history.created_at,
            note: history.note ?? '',
        }));

        return [...standardActivities, ...statusActivities].sort(
            (firstEntry, secondEntry) =>
                new Date(secondEntry.createdAt).getTime() -
                new Date(firstEntry.createdAt).getTime(),
        );
    }, [activityLogs, statusHistories]);

    const activityActors = useMemo(
        () =>
            [...new Set(activityEntries.map((entry) => entry.actorName))].sort(
                (firstName, secondName) => firstName.localeCompare(secondName),
            ),
        [activityEntries],
    );

    const activityTypes = useMemo(() => {
        const labelsByType = new Map();

        for (const entry of activityEntries) {
            labelsByType.set(entry.type, entry.typeLabel);
        }

        return [...labelsByType.entries()]
            .map(([value, label]) => ({
                value,
                label,
            }))
            .sort((firstType, secondType) =>
                firstType.label.localeCompare(secondType.label),
            );
    }, [activityEntries]);

    const filteredActivityEntries = useMemo(() => {
        const normalizedSearch = normalizeSearchValue(activitySearch);

        return activityEntries.filter((entry) => {
            const matchesSearch =
                !normalizedSearch ||
                normalizeSearchValue(entry.description).includes(
                    normalizedSearch,
                ) ||
                normalizeSearchValue(entry.actorName).includes(
                    normalizedSearch,
                ) ||
                normalizeSearchValue(entry.note).includes(normalizedSearch);

            const matchesActor =
                !activityActor || entry.actorName === activityActor;

            const matchesType = !activityType || entry.type === activityType;

            const matchesDate =
                !activityDate ||
                getDateInputValue(entry.createdAt) === activityDate;

            return matchesSearch && matchesActor && matchesType && matchesDate;
        });
    }, [
        activityActor,
        activityDate,
        activityEntries,
        activitySearch,
        activityType,
    ]);

    const hasCommentFilters = Boolean(commentSearch || commentDate);

    const hasActivityFilters = Boolean(
        activitySearch || activityActor || activityType || activityDate,
    );

    const loadTask = useCallback(async () => {
        setIsLoading(true);
        setPageError('');

        try {
            const [taskResponse, commentsResponse] = await Promise.all([
                getTask(taskId),
                listTaskComments(taskId),
            ]);

            const loadedTask = taskResponse.data?.task;

            if (!loadedTask?.id) {
                throw new Error('Laravel returned an invalid task response.');
            }

            setTask(loadedTask);
            setComments(commentsResponse.data ?? []);

            if (canAttemptActivity) {
                try {
                    const activityResponse = await getTaskActivity(taskId);

                    setActivityLogs(activityResponse.data?.activity_logs ?? []);

                    setStatusHistories(
                        activityResponse.data?.status_histories ?? [],
                    );

                    setCanViewActivity(true);
                } catch (error) {
                    if (error.response?.status === 403) {
                        setActivityLogs([]);
                        setStatusHistories([]);
                        setCanViewActivity(false);
                    } else {
                        throw error;
                    }
                }
            }
        } catch (error) {
            setPageError(
                getErrorMessage(error, 'The task could not be loaded.'),
            );
        } finally {
            setIsLoading(false);
        }
    }, [canAttemptActivity, taskId]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            loadTask();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadTask]);

    async function submitStatusChange(event) {
        event.preventDefault();

        if (!selectedStatus) {
            setStatusError('Select a new status.');
            return;
        }

        setIsUpdatingStatus(true);
        setStatusError('');
        setSuccessMessage('');

        try {
            const response = await updateTaskStatus(
                taskId,
                selectedStatus,
                transitionNote,
            );

            const updatedTask = response.data?.task;

            if (!updatedTask?.id) {
                throw new Error('Laravel returned an invalid status response.');
            }

            setTask(updatedTask);
            setSelectedStatus('');
            setTransitionNote('');
            setSuccessMessage(
                response.message ?? 'Task status updated successfully.',
            );

            if (canViewActivity) {
                const activityResponse = await getTaskActivity(taskId);

                setActivityLogs(activityResponse.data?.activity_logs ?? []);

                setStatusHistories(
                    activityResponse.data?.status_histories ?? [],
                );
            }
        } catch (error) {
            setStatusError(
                getErrorMessage(error, 'The task status could not be updated.'),
            );
        } finally {
            setIsUpdatingStatus(false);
        }
    }

    async function submitComment(event) {
        event.preventDefault();

        const normalizedBody = commentBody.trim();

        if (!normalizedBody) {
            setCommentError('Enter a comment.');
            return;
        }

        setIsAddingComment(true);
        setCommentError('');
        setSuccessMessage('');

        try {
            const response = await createTaskComment(taskId, normalizedBody);

            const newComment = response.data?.comment;

            if (!newComment?.id) {
                throw new Error(
                    'Laravel returned an invalid comment response.',
                );
            }

            setComments((currentComments) => [...currentComments, newComment]);

            setCommentBody('');
            setSuccessMessage(
                response.message ?? 'Task comment added successfully.',
            );

            if (canViewActivity) {
                const activityResponse = await getTaskActivity(taskId);

                setActivityLogs(activityResponse.data?.activity_logs ?? []);
            }
        } catch (error) {
            setCommentError(
                getErrorMessage(error, 'The comment could not be added.'),
            );
        } finally {
            setIsAddingComment(false);
        }
    }

    if (isLoading) {
        return (
            <section>
                <PageHeader
                    eyebrow="Task details"
                    title="Task Details"
                    description="Review task information, record progress, and discuss updates."
                    actions={
                        <Link
                            className="secondary-button button-link"
                            to="/tasks"
                        >
                            Back to Tasks
                        </Link>
                    }
                />

                <Loading message="Loading task details..." variant="details" />
            </section>
        );
    }

    if (pageError || !task) {
        return (
            <ErrorState
                message={pageError || 'The task could not be found.'}
                onRetry={loadTask}
            />
        );
    }

    return (
        <section>
            <PageHeader
                eyebrow="Task details"
                title={task.title}
                description="Review task information, record progress, and discuss updates."
                actions={
                    <div className="page-header-action-group">
                        <Link
                            className="secondary-button button-link"
                            to="/tasks"
                        >
                            Back to Tasks
                        </Link>

                        {user?.role === 'admin' || user?.role === 'manager' ? (
                            <Link
                                className="primary-button button-link"
                                to={`/tasks/${task.id}/edit`}
                            >
                                Edit Task
                            </Link>
                        ) : null}
                    </div>
                }
            />

            {successMessage ? (
                <div className="success-notification" role="status">
                    {successMessage}
                </div>
            ) : null}

            <div className="task-detail-layout">
                <main className="task-detail-main">
                    <section className="task-detail-card">
                        <div className="task-detail-card-header">
                            <div>
                                <p className="task-detail-eyebrow">
                                    Task information
                                </p>

                                <h3>Overview</h3>
                            </div>

                            <TaskStatusBadge status={task.status} />
                        </div>

                        <p className="task-detail-description">
                            {task.description || 'No description provided.'}
                        </p>

                        <dl className="task-detail-grid">
                            <div>
                                <dt>Priority</dt>
                                <dd>
                                    <TaskPriorityBadge
                                        priority={task.priority}
                                    />
                                </dd>
                            </div>

                            <div>
                                <dt>Team</dt>
                                <dd>{task.team?.name ?? 'Unassigned'}</dd>
                            </div>

                            <div>
                                <dt>Assignee</dt>
                                <dd>{task.assignee?.name ?? 'Unassigned'}</dd>
                            </div>

                            <div>
                                <dt>Created by</dt>
                                <dd>{task.creator?.name ?? 'Unknown'}</dd>
                            </div>

                            <div>
                                <dt>Due date</dt>
                                <dd>{formatDate(task.due_date)}</dd>
                            </div>

                            <div>
                                <dt>Last updated</dt>
                                <dd>{formatDate(task.updated_at, true)}</dd>
                            </div>
                        </dl>
                    </section>

                    <section className="task-detail-card">
                        <div className="task-detail-card-header">
                            <div>
                                <p className="task-detail-eyebrow">
                                    Collaboration
                                </p>

                                <h3>Comments</h3>
                            </div>

                            <span
                                className="task-section-count"
                                aria-label={`${filteredComments.length} of ${comments.length} comments shown`}
                            >
                                {hasCommentFilters
                                    ? `${filteredComments.length}/${comments.length}`
                                    : comments.length}
                            </span>
                        </div>

                        <form
                            className="task-comment-form"
                            onSubmit={submitComment}
                            noValidate
                        >
                            <label htmlFor="task-comment">Add an update</label>

                            <textarea
                                id="task-comment"
                                rows={4}
                                maxLength={2000}
                                value={commentBody}
                                placeholder="Share progress, blockers, or implementation notes."
                                aria-invalid={Boolean(commentError)}
                                onChange={(event) => {
                                    setCommentBody(event.target.value);
                                    setCommentError('');
                                }}
                            />

                            {commentError ? (
                                <p className="form-inline-error">
                                    {commentError}
                                </p>
                            ) : null}

                            <div className="task-comment-actions">
                                <span>
                                    {commentBody.length}/2000 characters
                                </span>

                                <button
                                    className="primary-button"
                                    type="submit"
                                    disabled={isAddingComment}
                                >
                                    {isAddingComment
                                        ? 'Posting...'
                                        : 'Post Comment'}
                                </button>
                            </div>
                        </form>

                        <div
                            className="task-history-filter task-comment-filter"
                            aria-label="Comment filters"
                        >
                            <div className="task-history-filter-field task-history-filter-search">
                                <label htmlFor="comment-history-search">
                                    Search comments
                                </label>

                                <input
                                    id="comment-history-search"
                                    type="search"
                                    value={commentSearch}
                                    placeholder="Search text or author"
                                    onChange={(event) =>
                                        setCommentSearch(event.target.value)
                                    }
                                />
                            </div>

                            <div className="task-history-filter-field">
                                <label htmlFor="comment-history-date">
                                    Date
                                </label>

                                <input
                                    id="comment-history-date"
                                    type="date"
                                    value={commentDate}
                                    onChange={(event) =>
                                        setCommentDate(event.target.value)
                                    }
                                />
                            </div>

                            <div className="task-history-filter-actions">
                                <span>
                                    Showing {filteredComments.length} of{' '}
                                    {comments.length}
                                </span>

                                <button
                                    type="button"
                                    className="task-filter-clear-button"
                                    disabled={!hasCommentFilters}
                                    onClick={() => {
                                        setCommentSearch('');
                                        setCommentDate('');
                                    }}
                                >
                                    Clear filters
                                </button>
                            </div>
                        </div>

                        {comments.length === 0 ? (
                            <EmptyState
                                title="No comments yet"
                                message="Add the first task update or discussion note."
                            />
                        ) : filteredComments.length === 0 ? (
                            <EmptyState
                                title="No matching comments"
                                message="Try changing or clearing the comment filters."
                            />
                        ) : (
                            <div className="task-comment-list">
                                {filteredComments.map((comment) => (
                                    <article
                                        className="task-comment"
                                        key={comment.id}
                                    >
                                        <div className="task-comment-header">
                                            <strong>
                                                {comment.user?.name ??
                                                    'Unknown user'}
                                            </strong>

                                            <time dateTime={comment.created_at}>
                                                {formatDate(
                                                    comment.created_at,
                                                    true,
                                                )}
                                            </time>
                                        </div>

                                        <p>{comment.body}</p>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>

                    {canViewActivity ? (
                        <section className="task-detail-card">
                            <div className="task-detail-card-header">
                                <div>
                                    <p className="task-detail-eyebrow">
                                        Restricted record
                                    </p>

                                    <h3>Activity Log</h3>
                                </div>

                                <span
                                    className="task-section-count"
                                    aria-label={`${filteredActivityEntries.length} of ${activityEntries.length} activity records shown`}
                                >
                                    {hasActivityFilters
                                        ? `${filteredActivityEntries.length}/${activityEntries.length}`
                                        : activityEntries.length}
                                </span>
                            </div>

                            <div
                                className="task-history-filter task-activity-filter"
                                aria-label="Activity filters"
                            >
                                <div className="task-history-filter-field task-history-filter-search">
                                    <label htmlFor="activity-history-search">
                                        Search activity
                                    </label>

                                    <input
                                        id="activity-history-search"
                                        type="search"
                                        value={activitySearch}
                                        placeholder="Search action, note, or actor"
                                        onChange={(event) =>
                                            setActivitySearch(
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <div className="task-history-filter-field">
                                    <label htmlFor="activity-history-actor">
                                        Changed by
                                    </label>

                                    <select
                                        id="activity-history-actor"
                                        value={activityActor}
                                        onChange={(event) =>
                                            setActivityActor(event.target.value)
                                        }
                                    >
                                        <option value="">All users</option>

                                        {activityActors.map((actor) => (
                                            <option key={actor} value={actor}>
                                                {actor}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="task-history-filter-field">
                                    <label htmlFor="activity-history-type">
                                        Activity type
                                    </label>

                                    <select
                                        id="activity-history-type"
                                        value={activityType}
                                        onChange={(event) =>
                                            setActivityType(event.target.value)
                                        }
                                    >
                                        <option value="">All activity</option>

                                        {activityTypes.map((type) => (
                                            <option
                                                key={type.value}
                                                value={type.value}
                                            >
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="task-history-filter-field">
                                    <label htmlFor="activity-history-date">
                                        Date
                                    </label>

                                    <input
                                        id="activity-history-date"
                                        type="date"
                                        value={activityDate}
                                        onChange={(event) =>
                                            setActivityDate(event.target.value)
                                        }
                                    />
                                </div>

                                <div className="task-history-filter-actions">
                                    <span>
                                        Showing {filteredActivityEntries.length}{' '}
                                        of {activityEntries.length}
                                    </span>

                                    <button
                                        type="button"
                                        className="task-filter-clear-button"
                                        disabled={!hasActivityFilters}
                                        onClick={() => {
                                            setActivitySearch('');
                                            setActivityActor('');
                                            setActivityType('');
                                            setActivityDate('');
                                        }}
                                    >
                                        Clear filters
                                    </button>
                                </div>
                            </div>

                            {activityEntries.length === 0 ? (
                                <EmptyState
                                    title="No activity recorded"
                                    message="Task changes will appear here."
                                />
                            ) : filteredActivityEntries.length === 0 ? (
                                <EmptyState
                                    title="No matching activity"
                                    message="Try changing or clearing the activity filters."
                                />
                            ) : (
                                <div className="task-activity-list">
                                    {filteredActivityEntries.map((entry) => (
                                        <article
                                            className={`task-activity-item task-activity-${entry.source}`}
                                            key={entry.id}
                                        >
                                            <span className="task-activity-marker" />

                                            <div>
                                                <strong>
                                                    {entry.description}
                                                </strong>

                                                <p>
                                                    {entry.actorName} ·{' '}
                                                    {formatDate(
                                                        entry.createdAt,
                                                        true,
                                                    )}
                                                </p>

                                                {entry.note ? (
                                                    <blockquote>
                                                        {entry.note}
                                                    </blockquote>
                                                ) : null}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    ) : null}
                </main>

                <aside className="task-detail-sidebar">
                    <section className="task-detail-card task-status-panel">
                        <p className="task-detail-eyebrow">Workflow</p>
                        <h3>Update Status</h3>

                        {task.allowed_transitions?.length ? (
                            <form
                                className="task-status-form"
                                onSubmit={submitStatusChange}
                                noValidate
                            >
                                <div className="form-field">
                                    <label htmlFor="next-task-status">
                                        New status
                                    </label>

                                    <select
                                        id="next-task-status"
                                        value={selectedStatus}
                                        aria-invalid={Boolean(statusError)}
                                        onChange={(event) => {
                                            setSelectedStatus(
                                                event.target.value,
                                            );
                                            setStatusError('');
                                        }}
                                    >
                                        <option value="">Select status</option>

                                        {task.allowed_transitions.map(
                                            (status) => (
                                                <option
                                                    key={status}
                                                    value={status}
                                                >
                                                    {getStatusLabel(status)}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label htmlFor="status-note">
                                        Transition note
                                    </label>

                                    <textarea
                                        id="status-note"
                                        rows={5}
                                        maxLength={1000}
                                        value={transitionNote}
                                        placeholder="Optional reason, result, or handoff note."
                                        onChange={(event) =>
                                            setTransitionNote(
                                                event.target.value,
                                            )
                                        }
                                    />

                                    <span className="form-help-text">
                                        Optional. Maximum 1000 characters.
                                    </span>
                                </div>

                                {statusError ? (
                                    <p className="form-inline-error">
                                        {statusError}
                                    </p>
                                ) : null}

                                <button
                                    className="primary-button task-status-submit"
                                    type="submit"
                                    disabled={isUpdatingStatus}
                                >
                                    {isUpdatingStatus
                                        ? 'Updating...'
                                        : 'Update Status'}
                                </button>
                            </form>
                        ) : (
                            <div className="task-terminal-state">
                                <TaskStatusBadge status={task.status} />

                                <p>
                                    This task has no available status
                                    transitions.
                                </p>
                            </div>
                        )}
                    </section>
                </aside>
            </div>
        </section>
    );
}
