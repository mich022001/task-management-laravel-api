import { useState } from 'react';

export default function TeamForm({
    managers,
<<<<<<< HEAD
    isSubmitting,
    validationErrors = {},
    onSubmit,
    onCancel,
}) {
    const [form, setForm] = useState({
        name: '',
        manager_id: '',
    });
=======
    initialValues = {
        name: '',
        manager_id: '',
    },
    isSubmitting,
    validationErrors = {},
    submitLabel = 'Create team',
    submittingLabel = 'Creating...',
    onSubmit,
    onCancel,
}) {
    const [form, setForm] = useState(initialValues);
>>>>>>> db23007 (feat(users): implement user management screens)

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((currentForm) => ({
            ...currentForm,
            [name]: value,
        }));
    }

    function handleSubmit(event) {
        event.preventDefault();

        onSubmit({
            name: form.name.trim(),
            manager_id: form.manager_id,
        });
    }

    function fieldErrors(field) {
        return validationErrors[field] ?? [];
    }

    return (
        <form className="task-form" onSubmit={handleSubmit}>
            <div className="task-form-grid">
                <div className="form-field">
                    <label htmlFor="team-name">
                        Team name <span>*</span>
                    </label>

                    <input
                        id="team-name"
                        name="name"
                        type="text"
                        value={form.name}
                        onChange={handleChange}
                        maxLength={150}
                        aria-invalid={fieldErrors('name').length > 0}
                        required
                    />

                    {fieldErrors('name').length > 0 ? (
                        <div className="form-field-errors">
                            {fieldErrors('name').map((message) => (
                                <p key={message}>{message}</p>
                            ))}
                        </div>
                    ) : null}
                </div>

                <div className="form-field">
                    <label htmlFor="team-manager">
                        Assigned manager <span>*</span>
                    </label>

                    <select
                        id="team-manager"
                        name="manager_id"
                        value={form.manager_id}
                        onChange={handleChange}
                        aria-invalid={fieldErrors('manager_id').length > 0}
                        required
                    >
                        <option value="">Select a manager</option>

                        {managers.map((manager) => (
                            <option key={manager.id} value={manager.id}>
                                {manager.name} — {manager.email}
                            </option>
                        ))}
                    </select>

                    {fieldErrors('manager_id').length > 0 ? (
                        <div className="form-field-errors">
                            {fieldErrors('manager_id').map((message) => (
                                <p key={message}>{message}</p>
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="task-form-actions">
                <button
                    type="submit"
                    className="primary-button"
                    disabled={isSubmitting || managers.length === 0}
                >
<<<<<<< HEAD
                    {isSubmitting ? 'Creating...' : 'Create team'}
=======
                    {isSubmitting ? submittingLabel : submitLabel}
>>>>>>> db23007 (feat(users): implement user management screens)
                </button>

                <button
                    type="button"
                    className="secondary-button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
