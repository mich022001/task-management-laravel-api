import { useState } from 'react';
import { Link } from 'react-router-dom';

import { requestPasswordReset } from '../services/auth.service.js';

function getErrorMessage(error) {
    const validationErrors = error.response?.data?.errors;

    if (validationErrors) {
        return Object.values(validationErrors).flat().join(' ');
    }

    return (
        error.response?.data?.message ??
        error.message ??
        'The password reset request could not be completed.'
    );
}

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        setSuccessMessage('');
        setErrorMessage('');
        setIsSubmitting(true);

        try {
            const response = await requestPasswordReset(email);

            setSuccessMessage(
                response.message ??
                    'If an account exists for that email address, a password reset link has been sent.',
            );
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

                    <h1>Forgot password</h1>

                    <p className="muted-text">
                        Enter the email address registered to your account. We
                        will send you a password reset link.
                    </p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    <label>
                        Email
                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            autoComplete="email"
                            placeholder="Enter your registered email"
                            required
                        />
                    </label>

                    {successMessage ? (
                        <p className="success-notification" role="status">
                            {successMessage}
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
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? 'Sending reset link...'
                            : 'Send reset link'}
                    </button>

                    <Link to="/login">Back to sign in</Link>
                </form>
            </section>
        </main>
    );
}
