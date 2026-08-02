const STATUS_LABELS = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

export default function TaskStatusBadge({ status }) {
    const label = STATUS_LABELS[status] ?? status ?? 'Unknown';

    return (
        <span className={`status-badge status-${status ?? 'unknown'}`}>
            {label}
        </span>
    );
}
