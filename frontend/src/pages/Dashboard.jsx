import { useCallback, useEffect, useState } from 'react';

import ErrorState from '../components/common/ErrorState.jsx';
import Loading from '../components/common/Loading.jsx';
import DashboardCards from '../components/dashboard/DashboardCards.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getTaskSummary } from '../services/analytics.service.js';

function getApiErrorMessage(error) {
    return (
        error.response?.data?.message ??
        'Dashboard analytics could not be loaded.'
    );
}

export default function Dashboard() {
    const { user } = useAuth();
    const canViewAnalytics = user?.role === 'admin' || user?.role === 'manager';

    const [summary, setSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(canViewAnalytics);
    const [errorMessage, setErrorMessage] = useState('');

    const retryLoadSummary = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const response = await getTaskSummary();

            setSummary(response.data);
        } catch (error) {
            setSummary(null);
            setErrorMessage(getApiErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!canViewAnalytics) {
            return undefined;
        }

        let isCancelled = false;

        getTaskSummary()
            .then((response) => {
                if (isCancelled) {
                    return;
                }

                setSummary(response.data);
                setErrorMessage('');
            })
            .catch((error) => {
                if (isCancelled) {
                    return;
                }

                setSummary(null);
                setErrorMessage(getApiErrorMessage(error));
            })
            .finally(() => {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [canViewAnalytics]);

    return (
        <section>
            <PageHeader
                eyebrow="Workspace overview"
                title="Dashboard"
                description="Review task activity, workload progress, and deadlines within your authorized workspace."
            />

            {!canViewAnalytics ? (
                <div className="state-panel">
                    <h3>Your assigned tasks</h3>
                    <p className="muted-text">
                        Open the Tasks page to review and update tasks assigned
                        to you.
                    </p>
                </div>
            ) : null}

            {isLoading ? (
                <Loading
                    message="Loading dashboard analytics..."
                    variant="dashboard"
                />
            ) : null}

            {!isLoading && errorMessage ? (
                <ErrorState message={errorMessage} onRetry={retryLoadSummary} />
            ) : null}

            {!isLoading && !errorMessage && summary ? (
                <DashboardCards summary={summary} />
            ) : null}
        </section>
    );
}
