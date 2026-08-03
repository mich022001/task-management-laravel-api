import { useCallback, useEffect, useState } from 'react';

import ErrorState from '../components/common/ErrorState.jsx';
import Loading from '../components/common/Loading.jsx';
import DashboardCards from '../components/dashboard/DashboardCards.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { getTaskSummary } from '../services/analytics.service.js';

function getApiErrorMessage(error) {
    return (
        error.response?.data?.message ??
        'Dashboard analytics could not be loaded.'
    );
}

export default function Dashboard() {
    const [summary, setSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
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
    }, []);

    return (
        <section>
            <PageHeader
                eyebrow="Workspace overview"
                title="Dashboard"
                description="Review task activity, workload progress, and deadlines within your authorized workspace."
            />

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
