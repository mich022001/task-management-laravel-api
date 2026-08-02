const PRIORITY_OPTIONS = [
    {
        value: 'low',
        label: 'Low',
    },
    {
        value: 'medium',
        label: 'Medium',
    },
    {
        value: 'high',
        label: 'High',
    },
];

function FieldError({ errors }) {
    if (!errors?.length) {
        return null;
    }

    return (
        <ul className="form-field-errors">
            {errors.map((error) => (
                <li key={error}>{error}</li>
            ))}
        </ul>
    );
}

export default function TaskForm({
    values,
    teams,
    members,
    errors = {},
    isSubmitting = false,
    isLoadingMembers = false,
    submitLabel = 'Create Task',
    onChange,
    onSubmit,
    onCancel,
}) {
    function updateField(event) {
        onChange({
            ...values,
            [event.target.name]: event.target.value,
        });
    }

    function submitForm(event) {
        event.preventDefault();
        onSubmit();
    }

    return (
        <form className="task-form" onSubmit={submitForm} noValidate>
            <div className="task-form-grid">
                <div className="form-field form-field-full">
                    <label htmlFor="task-title">
                        Title <span aria-hidden="true">*</span>
                    </label>

                    <input
                        id="task-title"
                        name="title"
                        type="text"
                        maxLength={255}
                        value={values.title}
                        aria-invalid={Boolean(errors.title)}
                        onChange={updateField}
                    />

                    <FieldError errors={errors.title} />
                </div>

                <div className="form-field form-field-full">
                    <label htmlFor="task-description">Description</label>

                    <textarea
                        id="task-description"
                        name="description"
                        rows={5}
                        value={values.description}
                        aria-invalid={Boolean(errors.description)}
                        onChange={updateField}
                    />

                    <FieldError errors={errors.description} />
                </div>

                <div className="form-field">
                    <label htmlFor="task-priority">
                        Priority <span aria-hidden="true">*</span>
                    </label>

                    <select
                        id="task-priority"
                        name="priority"
                        value={values.priority}
                        aria-invalid={Boolean(errors.priority)}
                        onChange={updateField}
                    >
                        <option value="">Select priority</option>

                        {PRIORITY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <FieldError errors={errors.priority} />
                </div>

                <div className="form-field">
                    <label htmlFor="task-team">
                        Assigned Team <span aria-hidden="true">*</span>
                    </label>

                    <select
                        id="task-team"
                        name="team_id"
                        value={values.team_id}
                        aria-invalid={Boolean(errors.team_id)}
                        onChange={updateField}
                    >
                        <option value="">Select team</option>

                        {teams.map((team) => (
                            <option key={team.id} value={String(team.id)}>
                                {team.name}
                            </option>
                        ))}
                    </select>

                    <FieldError errors={errors.team_id} />
                </div>

                <div className="form-field">
                    <label htmlFor="task-assignee">Assignee</label>

                    <select
                        id="task-assignee"
                        name="assigned_to"
                        value={values.assigned_to}
                        disabled={!values.team_id || isLoadingMembers}
                        aria-invalid={Boolean(errors.assigned_to)}
                        onChange={updateField}
                    >
                        <option value="">
                            {isLoadingMembers
                                ? 'Loading members...'
                                : 'Unassigned'}
                        </option>

                        {members.map((member) => (
                            <option key={member.id} value={String(member.id)}>
                                {member.name}
                            </option>
                        ))}
                    </select>

                    <FieldError errors={errors.assigned_to} />
                </div>

                <div className="form-field">
                    <label htmlFor="task-due-date">Due Date</label>

                    <input
                        id="task-due-date"
                        name="due_date"
                        type="date"
                        value={values.due_date}
                        aria-invalid={Boolean(errors.due_date)}
                        onChange={updateField}
                    />

                    <FieldError errors={errors.due_date} />
                </div>
            </div>

            <div className="task-form-actions">
                <button
                    type="button"
                    className="secondary-button"
                    disabled={isSubmitting}
                    onClick={onCancel}
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    className="primary-button"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Saving...' : submitLabel}
                </button>
            </div>
        </form>
    );
}
