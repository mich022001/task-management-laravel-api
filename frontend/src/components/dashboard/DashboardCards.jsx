import StatCard from '../ui/StatCard.jsx';

export default function DashboardCards({ summary }) {
    const cards = [
        {
            title: 'Total Tasks',
            value: summary.total_tasks ?? 0,
            description: 'Tasks within your authorized scope.',
            icon: 'clipboard',
            tone: 'primary',
        },
        {
            title: 'Pending',
            value: summary.status?.pending ?? 0,
            description: 'Tasks waiting to be started.',
            icon: 'clock',
            tone: 'warning',
        },
        {
            title: 'In Progress',
            value: summary.status?.in_progress ?? 0,
            description: 'Tasks currently being worked on.',
            icon: 'progress',
            tone: 'info',
        },
        {
            title: 'Completed',
            value: summary.completed_tasks ?? 0,
            description: `${summary.completion_rate ?? 0}% completion rate.`,
            icon: 'check',
            tone: 'success',
        },
        {
            title: 'Overdue',
            value: summary.overdue_tasks ?? 0,
            description: 'Incomplete tasks past their due date.',
            icon: 'alert',
            tone: 'danger',
        },
    ];

    return (
        <section className="stat-grid" aria-label="Task summary">
            {cards.map((card) => (
                <StatCard key={card.title} {...card} />
            ))}
        </section>
    );
}
