export default function TaskPagination({
    currentPage,
    lastPage,
    total,
    onPageChange,
}) {
    if (lastPage <= 1) {
        return null;
    }

    return (
        <nav className="pagination" aria-label="Task pagination">
            <button
                className="secondary-button"
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                Previous
            </button>

            <p>
                Page {currentPage} of {lastPage}
                <span className="pagination-total"> · {total} tasks</span>
            </p>

            <button
                className="secondary-button"
                type="button"
                disabled={currentPage >= lastPage}
                onClick={() => onPageChange(currentPage + 1)}
            >
                Next
            </button>
        </nav>
    );
}
