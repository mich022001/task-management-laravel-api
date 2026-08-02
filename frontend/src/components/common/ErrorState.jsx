import Icon from '../ui/Icon.jsx';

export default function ErrorState({
    title = 'Unable to load data',
    message = 'Something went wrong while loading this content.',
    onRetry,
}) {
    return (
        <section className="alert-card alert-card-error" role="alert">
            <div className="alert-card-accent" />

            <div className="alert-card-icon">
                <Icon name="alert" size={21} />
            </div>

            <div className="alert-card-content">
                <h3>{title}</h3>
                <p>{message}</p>
            </div>

            {onRetry ? (
                <button
                    className="alert-card-action"
                    type="button"
                    onClick={onRetry}
                >
                    <Icon name="refresh" size={17} />
                    <span>Retry</span>
                </button>
            ) : null}
        </section>
    );
}
