import Icon from '../ui/Icon.jsx';

export default function EmptyState({
    title = 'No records found',
    message = 'There is currently nothing to display.',
}) {
    return (
        <section className="feedback-state feedback-state-empty">
            <div className="feedback-state-icon">
                <Icon name="clipboard" size={22} />
            </div>

            <div className="feedback-state-content">
                <h3>{title}</h3>
                <p>{message}</p>
            </div>
        </section>
    );
}
