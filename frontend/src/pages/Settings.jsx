import { useEffect, useState } from 'react';

import ErrorState from '../components/common/ErrorState.jsx';
import Loading from '../components/common/Loading.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { useAuth } from '../hooks/useAuth.js';
import {
    getNotificationPreferences,
    updateNotificationPreferences,
} from '../services/notificationPreference.service.js';

function getApiErrorMessage(error) {
    return (
        error.response?.data?.message ??
        error.message ??
        'Notification preferences could not be loaded.'
    );
}

export default function Settings() {
    const { updateCurrentUser } = useAuth();

    const [emailNotificationsEnabled, setEmailNotificationsEnabled] =
        useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    async function loadPreferences() {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const response = await getNotificationPreferences();

            setEmailNotificationsEnabled(
                Boolean(response.data?.email_notifications_enabled),
            );
        } catch (error) {
            setErrorMessage(getApiErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        let isCancelled = false;

        getNotificationPreferences()
            .then((response) => {
                if (isCancelled) {
                    return;
                }

                setEmailNotificationsEnabled(
                    Boolean(response.data?.email_notifications_enabled),
                );

                setErrorMessage('');
            })
            .catch((error) => {
                if (!isCancelled) {
                    setErrorMessage(getApiErrorMessage(error));
                }
            })
            .finally(() => {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();

        setIsSaving(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const response = await updateNotificationPreferences(
                emailNotificationsEnabled,
            );

            const savedValue = Boolean(
                response.data?.email_notifications_enabled,
            );

            setEmailNotificationsEnabled(savedValue);

            updateCurrentUser({
                email_notifications_enabled: savedValue,
            });

            setSuccessMessage('Notification preferences updated successfully.');
        } catch (error) {
            setErrorMessage(getApiErrorMessage(error));
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <section>
            <PageHeader
                eyebrow="Account preferences"
                title="Settings"
                description="Control how the Task Management Platform communicates with you."
            />

            {isLoading ? (
                <Loading message="Loading notification preferences..." />
            ) : null}

            {!isLoading && errorMessage ? (
                <ErrorState message={errorMessage} onRetry={loadPreferences} />
            ) : null}

            {!isLoading && !errorMessage ? (
                <form
                    className="settings-form"
                    onSubmit={(event) => void handleSubmit(event)}
                >
                    <section className="settings-card">
                        <div className="settings-card-heading">
                            <div>
                                <h2>Email notifications</h2>

                                <p>
                                    Receive email updates when tasks are
                                    assigned to you or when relevant task
                                    statuses change.
                                </p>
                            </div>

                            <label className="settings-switch">
                                <input
                                    type="checkbox"
                                    checked={emailNotificationsEnabled}
                                    disabled={isSaving}
                                    onChange={(event) => {
                                        setEmailNotificationsEnabled(
                                            event.target.checked,
                                        );

                                        setSuccessMessage('');
                                    }}
                                />

                                <span
                                    className="settings-switch-track"
                                    aria-hidden="true"
                                >
                                    <span className="settings-switch-thumb" />
                                </span>

                                <span className="sr-only">
                                    Enable email notifications
                                </span>
                            </label>
                        </div>

                        <div className="settings-preference-status">
                            <strong>
                                {emailNotificationsEnabled
                                    ? 'Email notifications enabled'
                                    : 'Email notifications disabled'}
                            </strong>

                            <span>
                                In-app notifications remain available even when
                                email notifications are disabled.
                            </span>
                        </div>
                    </section>

                    {successMessage ? (
                        <div className="success-notification" role="status">
                            {successMessage}
                        </div>
                    ) : null}

                    <div className="settings-actions">
                        <button
                            type="submit"
                            className="primary-button"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save preferences'}
                        </button>
                    </div>
                </form>
            ) : null}
        </section>
    );
}
