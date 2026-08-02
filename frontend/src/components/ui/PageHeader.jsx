export default function PageHeader({ eyebrow, title, description, actions }) {
    return (
        <header className="page-header">
            <div className="page-header-copy">
                {eyebrow ? <p className="page-eyebrow">{eyebrow}</p> : null}

                <h2>{title}</h2>

                {description ? (
                    <p className="page-description">{description}</p>
                ) : null}
            </div>

            {actions ? (
                <div className="page-header-actions">{actions}</div>
            ) : null}
        </header>
    );
}
