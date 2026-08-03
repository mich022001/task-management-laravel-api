import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import ErrorState from '../components/common/ErrorState.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { registerUser } from '../services/auth.service.js';

function normalizeValidationErrors(error) {
    const validationErrors = error.response?.data?.errors;

    if (!validationErrors || typeof validationErrors !== 'object') {
        return {};
    }

    return Object.fromEntries(
        Object.entries(validationErrors).map(([field, messages]) => [
            field,
            Array.isArray(messages) ? messages : [String(messages)],
        ]),
    );
}

function getErrorMessage(error) {
    return (
        error.response?.data?.message ??
        error.message ??
        'Your account could not be registered.'
    );
}

function FieldErrors({ errors = [] }) {
    if (errors.length === 0) {
        return null;
    }

    return (
        <div className="field-errors" role="alert">
            {errors.map((message) => (
                <p key={message} className="error-message">
                    {message}
                </p>
            ))}
        </div>
    );
}

export default function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const [validationErrors, setValidationErrors] = useState({});
    const [pageError, setPageError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] =
        useState(false);

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((currentForm) => ({
            ...currentForm,
            [name]: value,
        }));

        setValidationErrors((currentErrors) => {
            if (!currentErrors[name]) {
                return currentErrors;
            }

            const nextErrors = { ...currentErrors };
            delete nextErrors[name];

            return nextErrors;
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setIsSubmitting(true);
        setValidationErrors({});
        setPageError('');

        try {
            const response = await registerUser(form);

            navigate('/login', {
                replace: true,
                state: {
                    successMessage:
                        response.message ??
                        'Registration successful. Your account is awaiting administrator approval.',
                },
            });
        } catch (error) {
            const errors = normalizeValidationErrors(error);

            setValidationErrors(errors);

            if (Object.keys(errors).length === 0) {
                setPageError(getErrorMessage(error));
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="login-page">
            <section className="login-card register-card">
                <PageHeader
                    eyebrow="Account Registration"
                    title="Create an Account"
                    description="Register for a Team Member account. An administrator must approve and activate your account before you can sign in."
                />

                {pageError ? <ErrorState message={pageError} /> : null}

                <form className="login-form" onSubmit={handleSubmit}>
                    <label>
                        Name
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            autoComplete="name"
                            maxLength={255}
                            required
                        />
                    </label>

                    <FieldErrors errors={validationErrors.name} />

                    <label>
                        Email
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            autoComplete="email"
                            maxLength={255}
                            required
                        />
                    </label>

                    <FieldErrors errors={validationErrors.email} />

                    <label>
                        Password
                        <div className="password-input-group">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                autoComplete="new-password"
                                required
                            />

                            <button
                                type="button"
                                className="secondary-button password-toggle"
                                onClick={() =>
                                    setShowPassword((current) => !current)
                                }
                                aria-label={
                                    showPassword
                                        ? 'Hide password'
                                        : 'Show password'
                                }
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </label>

                    <FieldErrors errors={validationErrors.password} />

                    <label>
                        Confirm Password
                        <div className="password-input-group">
                            <input
                                type={
                                    showPasswordConfirmation
                                        ? 'text'
                                        : 'password'
                                }
                                name="password_confirmation"
                                value={form.password_confirmation}
                                onChange={handleChange}
                                autoComplete="new-password"
                                required
                            />

                            <button
                                type="button"
                                className="secondary-button password-toggle"
                                onClick={() =>
                                    setShowPasswordConfirmation(
                                        (current) => !current,
                                    )
                                }
                                aria-label={
                                    showPasswordConfirmation
                                        ? 'Hide password confirmation'
                                        : 'Show password confirmation'
                                }
                            >
                                {showPasswordConfirmation ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </label>

                    <FieldErrors
                        errors={validationErrors.password_confirmation}
                    />

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="primary-button"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? 'Creating account...'
                                : 'Create account'}
                        </button>

                        <Link to="/login" className="secondary-button">
                            Back to sign in
                        </Link>
                    </div>
                </form>

                <p className="form-help-text">
                    New accounts are registered as inactive Team Members and
                    require administrator approval.
                </p>
            </section>
        </main>
    );
}
