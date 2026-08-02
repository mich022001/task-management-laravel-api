import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

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
        email: 'admin@test.com',
        password: 'password123',
    });

    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const destination = location.state?.from?.pathname ?? '/dashboard';

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

                    <p className="muted-text">
                        Use your Laravel account to access the platform.
                    </p>
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
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            autoComplete="current-password"
                            required
                        />
                    </label>

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
                </form>
            </section>
        </main>
    );
}
