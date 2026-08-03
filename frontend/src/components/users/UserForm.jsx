import { useState } from 'react';

const initialForm = {
    name: '',
    email: '',
    password: '',
    role: 'team_member',
    is_active: true,
};

function getInitialForm(user) {
    if (!user) {
        return initialForm;
    }

    return {
        name: user.name ?? '',
        email: user.email ?? '',
        password: '',
        role: user.role ?? 'team_member',
        is_active: user.is_active ?? true,
    };
}

export default function UserForm({
    user = null,
    allowedRoles,
    isSubmitting,
    validationErrors = {},
    onSubmit,
    onCancel,
}) {
    const [form, setForm] = useState(() => getInitialForm(user));
    const [showPassword, setShowPassword] = useState(false);

    const isEditing = Boolean(user);

    function handleChange(event) {
        const { name, type, checked, value } = event.target;

        setForm((currentForm) => ({
            ...currentForm,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }

    function handleSubmit(event) {
        event.preventDefault();

        const payload = {
            name: form.name.trim(),
            email: form.email.trim(),
            role: form.role,
        };

        if (!isEditing) {
            payload.password = form.password;
            payload.is_active = form.is_active;
        }

        onSubmit(payload);
    }

    function fieldErrors(field) {
        return validationErrors[field] ?? [];
    }

    return (
        <form className="task-form" onSubmit={handleSubmit}>
            <div className="task-form-grid">
                <div className="form-field">
                    <label htmlFor="user-name">
                        Name <span>*</span>
                    </label>

                    <input
                        id="user-name"
                        name="name"
                        type="text"
                        value={form.name}
                        onChange={handleChange}
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
                    <label htmlFor="user-email">
                        Email <span>*</span>
                    </label>

                    <input
                        id="user-email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        aria-invalid={fieldErrors('email').length > 0}
                        required
                    />

                    {fieldErrors('email').length > 0 ? (
                        <div className="form-field-errors">
                            {fieldErrors('email').map((message) => (
                                <p key={message}>{message}</p>
                            ))}
                        </div>
                    ) : null}
                </div>

                {!isEditing ? (
                    <div className="form-field">
                        <label htmlFor="user-password">
                            Password <span>*</span>
                        </label>

                        <div className="password-input-wrapper">
                            <input
                                id="user-password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={handleChange}
                                autoComplete="new-password"
                                minLength={8}
                                aria-invalid={
                                    fieldErrors('password').length > 0
                                }
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowPassword((current) => !current)
                                }
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>

                        {fieldErrors('password').length > 0 ? (
                            <div className="form-field-errors">
                                {fieldErrors('password').map((message) => (
                                    <p key={message}>{message}</p>
                                ))}
                            </div>
                        ) : null}
                    </div>
                ) : null}

                <div className="form-field">
                    <label htmlFor="user-role">
                        Role <span>*</span>
                    </label>

                    <select
                        id="user-role"
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        aria-invalid={fieldErrors('role').length > 0}
                        required
                    >
                        {allowedRoles.map((role) => (
                            <option key={role.value} value={role.value}>
                                {role.label}
                            </option>
                        ))}
                    </select>

                    {fieldErrors('role').length > 0 ? (
                        <div className="form-field-errors">
                            {fieldErrors('role').map((message) => (
                                <p key={message}>{message}</p>
                            ))}
                        </div>
                    ) : null}
                </div>

                {!isEditing ? (
                    <div className="form-field form-field-full">
                        <label className="checkbox-field">
                            <input
                                name="is_active"
                                type="checkbox"
                                checked={form.is_active}
                                onChange={handleChange}
                            />

                            <span>Create this account as active</span>
                        </label>
                    </div>
                ) : null}
            </div>

            <div className="task-form-actions">
                <button
                    type="submit"
                    className="primary-button"
                    disabled={isSubmitting}
                >
                    {isSubmitting
                        ? 'Saving...'
                        : isEditing
                          ? 'Save changes'
                          : 'Create user'}
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
