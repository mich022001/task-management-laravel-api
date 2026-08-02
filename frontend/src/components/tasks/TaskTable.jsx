import { Link } from 'react-router-dom';

import TaskPriorityBadge from './TaskPriorityBadge.jsx';
import TaskStatusBadge from './TaskStatusBadge.jsx';

function formatDueDate(value) {
    if (!value) {
        return 'No due date';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Invalid date';
    }

    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
    }).format(date);
}

export default function TaskTable({ tasks, canEditTasks = false }) {
    return (
        <div className="table-container task-table-container">
            <table className="task-table">
                <thead>
                    <tr>
                        <th>Task</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Team</th>
                        <th>Assignee</th>
                        <th>Due date</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {tasks.map((task) => (
                        <tr key={task.id}>
                            <td className="task-primary-cell">
                                <strong className="task-title">
                                    {task.title}
                                </strong>

                                {task.description ? (
                                    <p
                                        className="task-description"
                                        title={task.description}
                                    >
                                        {task.description}
                                    </p>
                                ) : null}
                            </td>

                            <td>
                                <TaskStatusBadge status={task.status} />
                            </td>

                            <td>
                                <TaskPriorityBadge priority={task.priority} />
                            </td>

                            <td>
                                <span className="task-metadata">
                                    {task.team?.name ?? 'Unassigned'}
                                </span>
                            </td>

                            <td>
                                <span className="task-metadata">
                                    {task.assignee?.name ?? 'Unassigned'}
                                </span>
                            </td>

                            <td>
                                <span className="task-due-date">
                                    {formatDueDate(task.due_date)}
                                </span>
                            </td>

                            <td className="task-actions-cell">
                                <div className="task-row-actions">
                                    <Link
                                        className="table-action-link"
                                        to={`/tasks/${task.id}`}
                                    >
                                        Details
                                    </Link>

                                    {canEditTasks ? (
                                        <Link
                                            className="table-action-link table-action-link-secondary"
                                            to={`/tasks/${task.id}/edit`}
                                        >
                                            Edit
                                        </Link>
                                    ) : null}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
