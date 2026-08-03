import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.js';

function getErrorMessage(error) {
    return (
        error.response?.data?.message ??
        error.message ??
        'Login failed. Please try again.'
    );
}

export default function Login() {
    const { isAuthenticated, isInitializing, login } = useAuth();

    const location = useLocation();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: '',
        password: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const destination = location.state?.from?.pathname ?? '/dashboard';
    const successMessage = location.state?.successMessage ?? '';

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((currentForm) => ({
            ...currentForm,
            [name]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setErrorMessage('');
        setIsSubmitting(true);

        try {
            await login(form);

            navigate(destination, {
                replace: true,
            });
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isInitializing) {
        return (
            <main className="route-message">
                <p>Checking your session...</p>
            </main>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <main className="login-page">
            <section className="login-card">
                <div>
                    <p className="eyebrow">Task Management Platform</p>

                    <h1>Sign in</h1>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    <label>
                        Email
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            autoComplete="email"
                            required
                        />
                    </label>

                    <label>
                        Password
                        <div className="password-input-group">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                autoComplete="current-password"
                                required
                            />

                            <button
                                type="button"
                                className="secondary-button password-toggle"
                                onClick={() =>
                                    setShowPassword(
                                        (currentValue) => !currentValue,
                                    )
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

                    <div className="forgot-password-link">
                        <Link to="/forgot-password">Forgot your password?</Link>
                    </div>

                    {successMessage ? (
                        <p className="success-message" role="status">
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
                        {isSubmitting ? 'Signing in...' : 'Sign in'}
                    </button>

                    <p className="auth-register-prompt">
                        Don't have an account?{' '}
                        <Link to="/register">Create an account</Link>
                    </p>
                </form>
            </section>
        </main>
    );
}
