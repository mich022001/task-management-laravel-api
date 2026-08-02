import Icon from './Icon.jsx';

export default function StatCard({
    title,
    value,
    description,
    icon,
    tone = 'primary',
}) {
    return (
        <article className={`stat-card stat-card-${tone}`}>
            <div className="stat-card-header">
                <div className={`stat-card-icon stat-card-icon-${tone}`}>
                    <Icon name={icon} size={21} />
                </div>

                <span className="stat-card-label">{title}</span>
            </div>

            <strong className="stat-card-value">{value}</strong>

            {description ? (
                <p className="stat-card-description">{description}</p>
            ) : null}
        </article>
    );
}
