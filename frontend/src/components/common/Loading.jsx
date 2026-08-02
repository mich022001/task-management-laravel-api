function SkeletonLine({ width = '100%', className = '' }) {
    return (
        <span
            className={`skeleton-block skeleton-line ${className}`.trim()}
            style={{
                width,
            }}
        />
    );
}

function DashboardSkeleton() {
    return (
        <div
            className="loading-skeleton-grid loading-dashboard-skeleton"
            aria-hidden="true"
        >
            {Array.from({
                length: 5,
            }).map((_, index) => (
                <div className="skeleton-card skeleton-stat-card" key={index}>
                    <div className="skeleton-stat-card-header">
                        <SkeletonLine width="42%" />
                        <span className="skeleton-block skeleton-icon" />
                    </div>

                    <SkeletonLine
                        width="30%"
                        className="skeleton-line-prominent"
                    />

                    <SkeletonLine width="76%" />
                    <SkeletonLine width="58%" />
                </div>
            ))}
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="skeleton-table-card" aria-hidden="true">
            <div className="skeleton-table-header">
                {Array.from({
                    length: 7,
                }).map((_, index) => (
                    <SkeletonLine width="62%" key={index} />
                ))}
            </div>

            {Array.from({
                length: 6,
            }).map((_, rowIndex) => (
                <div className="skeleton-table-row" key={rowIndex}>
                    <div className="skeleton-task-copy">
                        <SkeletonLine width="72%" />
                        <SkeletonLine width="48%" />
                    </div>

                    <span className="skeleton-block skeleton-badge" />
                    <span className="skeleton-block skeleton-badge" />

                    <SkeletonLine width="58%" />
                    <SkeletonLine width="64%" />
                    <SkeletonLine width="54%" />

                    <div className="skeleton-table-actions">
                        <span className="skeleton-block skeleton-button-small" />
                        <span className="skeleton-block skeleton-button-small" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function FormSkeleton() {
    return (
        <div className="skeleton-card skeleton-form-card" aria-hidden="true">
            <div className="skeleton-form-grid">
                <div className="skeleton-form-field skeleton-form-field-full">
                    <SkeletonLine width="14%" />
                    <span className="skeleton-block skeleton-input" />
                </div>

                <div className="skeleton-form-field skeleton-form-field-full">
                    <SkeletonLine width="18%" />
                    <span className="skeleton-block skeleton-textarea" />
                </div>

                {Array.from({
                    length: 4,
                }).map((_, index) => (
                    <div className="skeleton-form-field" key={index}>
                        <SkeletonLine width="32%" />
                        <span className="skeleton-block skeleton-input" />
                    </div>
                ))}
            </div>

            <div className="skeleton-form-actions">
                <span className="skeleton-block skeleton-button" />
                <span className="skeleton-block skeleton-button" />
            </div>
        </div>
    );
}

function DetailsSkeleton() {
    return (
        <div className="skeleton-detail-layout" aria-hidden="true">
            <main className="skeleton-detail-main">
                <section className="skeleton-card skeleton-detail-card">
                    <div className="skeleton-detail-card-heading">
                        <div>
                            <SkeletonLine width="120px" />
                            <SkeletonLine
                                width="170px"
                                className="skeleton-line-heading"
                            />
                        </div>

                        <span className="skeleton-block skeleton-badge" />
                    </div>

                    <div className="skeleton-detail-description">
                        <SkeletonLine width="72%" />
                        <SkeletonLine width="46%" />
                    </div>

                    <div className="skeleton-detail-grid">
                        {Array.from({
                            length: 6,
                        }).map((_, index) => (
                            <div key={index}>
                                <SkeletonLine width="46%" />
                                <SkeletonLine width="64%" />
                            </div>
                        ))}
                    </div>
                </section>

                <section className="skeleton-card skeleton-detail-card">
                    <SkeletonLine width="110px" />
                    <SkeletonLine
                        width="155px"
                        className="skeleton-line-heading"
                    />

                    <span className="skeleton-block skeleton-textarea" />

                    <div className="skeleton-comment-row">
                        <span className="skeleton-block skeleton-avatar" />

                        <div>
                            <SkeletonLine width="38%" />
                            <SkeletonLine width="88%" />
                            <SkeletonLine width="63%" />
                        </div>
                    </div>
                </section>
            </main>

            <aside className="skeleton-card skeleton-detail-sidebar">
                <SkeletonLine width="42%" />
                <SkeletonLine width="68%" className="skeleton-line-heading" />

                <SkeletonLine width="34%" />
                <span className="skeleton-block skeleton-input" />

                <SkeletonLine width="45%" />
                <span className="skeleton-block skeleton-textarea-small" />

                <span className="skeleton-block skeleton-submit-button" />
            </aside>
        </div>
    );
}

export default function Loading({
    message = 'Loading...',
    variant = 'default',
}) {
    return (
        <section
            className={`loading-skeleton loading-skeleton-${variant}`}
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <div className="loading-skeleton-label">
                <span className="loading-skeleton-spinner" aria-hidden="true" />
                <span>{message}</span>
            </div>

            {variant === 'dashboard' ? <DashboardSkeleton /> : null}
            {variant === 'table' ? <TableSkeleton /> : null}
            {variant === 'form' ? <FormSkeleton /> : null}
            {variant === 'details' ? <DetailsSkeleton /> : null}

            {variant === 'default' ? (
                <div className="skeleton-card skeleton-default-card">
                    <SkeletonLine width="28%" />
                    <SkeletonLine width="82%" />
                    <SkeletonLine width="64%" />
                </div>
            ) : null}
        </section>
    );
}
