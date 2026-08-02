const PRIORITY_LABELS = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
};

export default function TaskPriorityBadge({ priority }) {
    const label = PRIORITY_LABELS[priority] ?? priority ?? 'Unknown';

    return (
        <span className={`priority-badge priority-${priority ?? 'unknown'}`}>
            {label}
        </span>
    );
}
