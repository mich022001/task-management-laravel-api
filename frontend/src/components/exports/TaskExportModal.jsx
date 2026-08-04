import { useEffect, useState } from 'react';

import Icon from '../ui/Icon.jsx';

const INITIAL_FORM = {
    format: 'csv',
    team_id: '',
    status: '',
    priority: '',
    assigned_to: '',
    date_from: '',
    date_to: '',
};

function getTodayString() {
    return new Date().toISOString().slice(0, 10);
}

function getScopeDescription(scope) {
    if (scope === 'self') {
        return 'Only your assigned task records will be included.';
    }

    if (scope === 'managed') {
        return 'You may export tasks from teams you create or handle.';
    }

    return 'You may export all task records or narrow the report by team and person.';
}

export default function TaskExportModal({
    isOpen,
    scope,
    teams,
    users,
    isOptionsLoading,
    isSubmitting,
    errorMessage,
    onClose,
    onSubmit,
}) {
    const [form, setForm] = useState(INITIAL_FORM);
    const [validationMessage, setValidationMessage] = useState('');

    const isSelfScope = scope === 'self';

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        function handleKeyDown(event) {
            if (event.key === 'Escape' && !isSubmitting) {
                setForm(INITIAL_FORM);
                setValidationMessage('');
                onClose();
            }
        }

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, isSubmitting, onClose]);

    if (!isOpen) {
        return null;
    }

    function updateField(event) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));

        setValidationMessage('');
    }

    async function submitExport(event) {
        event.preventDefault();

        if (form.date_from && form.date_to && form.date_from > form.date_to) {
            setValidationMessage('Date to must not be earlier than date from.');

            return;
        }

        await onSubmit({
            format: form.format,
            team_id: isSelfScope ? '' : form.team_id,
            filters: {
                status: form.status,
                priority: form.priority,
                assigned_to: isSelfScope ? '' : form.assigned_to,
                date_from: form.date_from,
                date_to: form.date_to,
            },
        });
    }

    function closeModal() {
        setForm(INITIAL_FORM);
        setValidationMessage('');
        onClose();
    }

    return (
        <div
            className="export-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !isSubmitting) {
                    closeModal();
                }
            }}
        >
            <section
                className="export-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="task-export-title"
            >
                <header className="export-modal-header">
                    <div>
                        <p className="page-eyebrow">Data export</p>

                        <h2 id="task-export-title">Export Tasks</h2>

                        <p>{getScopeDescription(scope)}</p>
                    </div>

                    <button
                        type="button"
                        className="export-modal-close"
                        aria-label="Close export modal"
                        disabled={isSubmitting}
                        onClick={closeModal}
                    >
                        <Icon name="close" size={20} />
                    </button>
                </header>

                <form className="export-form" onSubmit={submitExport}>
                    <fieldset className="export-format-group">
                        <legend>File to download</legend>

                        <label className="export-format-option">
                            <input
                                type="radio"
                                name="format"
                                value="csv"
                                checked={form.format === 'csv'}
                                onChange={updateField}
                            />

                            <span>
                                <strong>CSV</strong>
                                <small>Comma-separated task data</small>
                            </span>
                        </label>

                        <label className="export-format-option">
                            <input
                                type="radio"
                                name="format"
                                value="json"
                                checked={form.format === 'json'}
                                onChange={updateField}
                            />

                            <span>
                                <strong>JSON</strong>
                                <small>Structured machine-readable data</small>
                            </span>
                        </label>

                        <label className="export-format-option">
                            <input
                                type="radio"
                                name="format"
                                value="xlsx"
                                checked={form.format === 'xlsx'}
                                onChange={updateField}
                            />

                            <span>
                                <strong>Excel</strong>
                                <small>Microsoft Excel workbook (.xlsx)</small>
                            </span>
                        </label>
                    </fieldset>

                    {isSelfScope ? (
                        <div className="export-scope-notice">
                            <strong>Report scope: My tasks only</strong>

                            <span>
                                Your account will automatically be applied as
                                the assigned user.
                            </span>
                        </div>
                    ) : null}

                    <div className="export-filter-grid">
                        {!isSelfScope ? (
                            <div className="form-field">
                                <label htmlFor="export-team">Team</label>

                                <select
                                    id="export-team"
                                    name="team_id"
                                    value={form.team_id}
                                    disabled={isOptionsLoading || isSubmitting}
                                    onChange={updateField}
                                >
                                    <option value="">
                                        {scope === 'managed'
                                            ? 'All handled teams'
                                            : 'All teams'}
                                    </option>

                                    {teams.map((team) => (
                                        <option key={team.id} value={team.id}>
                                            {team.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : null}

                        {!isSelfScope ? (
                            <div className="form-field">
                                <label htmlFor="export-assignee">
                                    Assigned user
                                </label>

                                <select
                                    id="export-assignee"
                                    name="assigned_to"
                                    value={form.assigned_to}
                                    disabled={isOptionsLoading || isSubmitting}
                                    onChange={updateField}
                                >
                                    <option value="">All assigned users</option>

                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} — {user.email}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : null}

                        <div className="form-field">
                            <label htmlFor="export-status">Status</label>

                            <select
                                id="export-status"
                                name="status"
                                value={form.status}
                                disabled={isSubmitting}
                                onChange={updateField}
                            >
                                <option value="">All statuses</option>
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div className="form-field">
                            <label htmlFor="export-priority">Priority</label>

                            <select
                                id="export-priority"
                                name="priority"
                                value={form.priority}
                                disabled={isSubmitting}
                                onChange={updateField}
                            >
                                <option value="">All priorities</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        <div className="form-field">
                            <label htmlFor="export-date-from">Date from</label>

                            <input
                                id="export-date-from"
                                name="date_from"
                                type="date"
                                max={form.date_to || getTodayString()}
                                value={form.date_from}
                                disabled={isSubmitting}
                                onChange={updateField}
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="export-date-to">Date to</label>

                            <input
                                id="export-date-to"
                                name="date_to"
                                type="date"
                                min={form.date_from || undefined}
                                value={form.date_to}
                                disabled={isSubmitting}
                                onChange={updateField}
                            />
                        </div>
                    </div>

                    {isOptionsLoading ? (
                        <p className="export-form-message">
                            Loading authorized export options...
                        </p>
                    ) : null}

                    {validationMessage ? (
                        <p className="export-form-error" role="alert">
                            {validationMessage}
                        </p>
                    ) : null}

                    {errorMessage ? (
                        <p className="export-form-error" role="alert">
                            {errorMessage}
                        </p>
                    ) : null}

                    <footer className="export-modal-actions">
                        <button
                            type="button"
                            className="secondary-button"
                            disabled={isSubmitting}
                            onClick={closeModal}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="primary-button"
                            disabled={isSubmitting || isOptionsLoading}
                        >
                            {isSubmitting
                                ? 'Preparing export...'
                                : 'Download Export'}
                        </button>
                    </footer>
                </form>
            </section>
        </div>
    );
}
