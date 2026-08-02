import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { resetPassword } from '../services/auth.service.js';

function getErrorMessage(error) {
    const validationErrors = error.response?.data?.errors;

    if (validationErrors) {
        return Object.values(validationErrors).flat().join(' ');
    }

    return (
        error.response?.data?.message ??
        error.message ??
        'The password could not be reset.'
    );
}

export default function ResetPassword() {
    const [searchParams] = useSearchParams();

    const token = searchParams.get('token') ?? '';
    const email = searchParams.get('email') ?? '';

    const [form, setForm] = useState({
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] =
        useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const hasValidLinkParameters = Boolean(token && email);

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((currentForm) => ({
            ...currentForm,
            [name]: value,
        }));

        setErrorMessage('');
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setErrorMessage('');

        if (!hasValidLinkParameters) {
            setErrorMessage(
                'This password reset link is missing its token or email address.',
            );

            return;
        }

        if (form.password !== form.password_confirmation) {
            setErrorMessage('The passwords do not match.');

            return;
        }

        setIsSubmitting(true);

        try {
            const response = await resetPassword({
                email,
                token,
                password: form.password,
                password_confirmation: form.password_confirmation,
            });

            setSuccessMessage(
                response.message ?? 'Password reset successfully.',
            );

            setForm({
                password: '',
                password_confirmation: '',
            });
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="login-page">
            <section className="login-card">
                <div>
                    <p className="eyebrow">Account recovery</p>

                    <h1>Reset password</h1>

                    <p className="muted-text">
                        Create a new password for your account.
                    </p>
                </div>

                {successMessage ? (
                    <div className="login-form">
                        <p className="success-notification" role="status">
                            {successMessage}
                        </p>

                        <Link
                            to="/login"
                            className="primary-button button-link"
                        >
                            Back to login
                        </Link>
                    </div>
                ) : (
                    <form className="login-form" onSubmit={handleSubmit}>
                        <label>
                            Email
                            <input
                                type="email"
                                value={email}
                                readOnly
                                aria-readonly="true"
                            />
                        </label>

                        <label>
                            New password
                            <div className="password-input-group">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                />

                                <button
                                    type="button"
                                    className="password-visibility-button"
                                    onClick={() =>
                                        setShowPassword(
                                            (currentValue) => !currentValue,
                                        )
                                    }
                                    aria-label={
                                        showPassword
                                            ? 'Hide new password'
                                            : 'Show new password'
                                    }
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </label>

                        <label>
                            Confirm new password
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
                                    minLength={8}
                                    required
                                />

                                <button
                                    type="button"
                                    className="password-visibility-button"
                                    onClick={() =>
                                        setShowPasswordConfirmation(
                                            (currentValue) => !currentValue,
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

                        {!hasValidLinkParameters ? (
                            <p className="error-message" role="alert">
                                This password reset link is incomplete or
                                invalid. Request a new reset link from the login
                                page.
                            </p>
                        ) : null}

                        {errorMessage ? (
                            <p className="error-message" role="alert">
                                {errorMessage}
                            </p>
                        ) : null}

                        <button
                            type="submit"
                            className="primary-button"
                            disabled={isSubmitting || !hasValidLinkParameters}
                        >
                            {isSubmitting
                                ? 'Resetting password...'
                                : 'Reset password'}
                        </button>

                        <Link to="/login">Back to login</Link>
                    </form>
                )}
            </section>
        </main>
    );
}
