import { useCallback, useEffect, useState } from 'react';

import ErrorState from '../components/common/ErrorState.jsx';
import Loading from '../components/common/Loading.jsx';
import DashboardCards from '../components/dashboard/DashboardCards.jsx';
import DashboardOverview from '../components/dashboard/DashboardOverview.jsx';
import TaskExportModal from '../components/exports/TaskExportModal.jsx';
import Icon from '../components/ui/Icon.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getDashboardAnalytics } from '../services/analytics.service.js';
import { downloadTasks, getExportOptions } from '../services/export.service.js';

function getApiErrorMessage(error) {
    return (
        error.response?.data?.message ??
        error.message ??
        'Dashboard analytics could not be loaded.'
    );
}

function getDownloadFilename(contentDisposition, format) {
    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

    if (utf8Match?.[1]) {
        return decodeURIComponent(utf8Match[1]);
    }

    const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);

    if (filenameMatch?.[1]) {
        return filenameMatch[1];
    }

    return `tasks-export.${format}`;
}

function triggerBrowserDownload(blob, filename) {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = objectUrl;
    link.download = filename;
    link.style.display = 'none';

    document.body.append(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(objectUrl);
}

export default function Dashboard() {
    const { user } = useAuth();

    const [dashboardAnalytics, setDashboardAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    const [isExportOpen, setIsExportOpen] = useState(false);
    const [isExportSubmitting, setIsExportSubmitting] = useState(false);
    const [isExportOptionsLoading, setIsExportOptionsLoading] = useState(false);
    const [exportErrorMessage, setExportErrorMessage] = useState('');
    const [exportScope, setExportScope] = useState('self');
    const [exportTeams, setExportTeams] = useState([]);
    const [exportUsers, setExportUsers] = useState([]);

    const canExportTasks = ['admin', 'manager', 'team_member'].includes(
        user?.role,
    );

    const retryLoadDashboard = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const response = await getDashboardAnalytics({
                days: 7,
            });

            setDashboardAnalytics(response.data);
        } catch (error) {
            setDashboardAnalytics(null);
            setErrorMessage(getApiErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        let isCancelled = false;

        getDashboardAnalytics({
            days: 7,
        })
            .then((response) => {
                if (isCancelled) {
                    return;
                }

                setDashboardAnalytics(response.data);
                setErrorMessage('');
            })
            .catch((error) => {
                if (isCancelled) {
                    return;
                }

                setDashboardAnalytics(null);
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

    async function openExportModal() {
        setIsExportOpen(true);
        setIsExportOptionsLoading(true);
        setExportErrorMessage('');

        try {
            const response = await getExportOptions();
            const options = response.data ?? {};

            setExportScope(options.scope ?? 'self');
            setExportTeams(options.teams ?? []);
            setExportUsers(options.users ?? []);
        } catch (error) {
            setExportTeams([]);
            setExportUsers([]);
            setExportErrorMessage(
                getApiErrorMessage(error) ||
                    'Export filter options could not be loaded.',
            );
        } finally {
            setIsExportOptionsLoading(false);
        }
    }

    function closeExportModal() {
        if (isExportSubmitting) {
            return;
        }

        setIsExportOpen(false);
        setExportErrorMessage('');
    }

    async function handleTaskExport(payload) {
        setIsExportSubmitting(true);
        setExportErrorMessage('');

        try {
            const response = await downloadTasks(payload);

            const filename = getDownloadFilename(
                response.contentDisposition,
                payload.format,
            );

            triggerBrowserDownload(response.blob, filename);
            setIsExportOpen(false);
        } catch (error) {
            setExportErrorMessage(
                getApiErrorMessage(error) ||
                    'Task export could not be generated.',
            );
        } finally {
            setIsExportSubmitting(false);
        }
    }

    return (
        <section>
            <PageHeader
                eyebrow="Workspace overview"
                title="Dashboard"
                description="Review task activity, workload progress, and deadlines within your authorized workspace."
                actions={
                    canExportTasks ? (
                        <button
                            type="button"
                            className="primary-button dashboard-export-button"
                            onClick={openExportModal}
                        >
                            <Icon name="clipboard" size={18} />
                            <span>Export Tasks</span>
                        </button>
                    ) : null
                }
            />

            {isLoading ? (
                <Loading
                    message="Loading dashboard analytics..."
                    variant="dashboard"
                />
            ) : null}

            {!isLoading && errorMessage ? (
                <ErrorState
                    message={errorMessage}
                    onRetry={retryLoadDashboard}
                />
            ) : null}

            {!isLoading && !errorMessage && dashboardAnalytics ? (
                <>
                    <DashboardCards summary={dashboardAnalytics.summary} />

                    <DashboardOverview
                        summary={dashboardAnalytics.summary}
                        deadlines={dashboardAnalytics.deadlines}
                        teamHighlights={dashboardAnalytics.team_highlights}
                    />
                </>
            ) : null}

            <TaskExportModal
                isOpen={isExportOpen}
                scope={exportScope}
                teams={exportTeams}
                users={exportUsers}
                isOptionsLoading={isExportOptionsLoading}
                isSubmitting={isExportSubmitting}
                errorMessage={exportErrorMessage}
                onClose={closeExportModal}
                onSubmit={handleTaskExport}
            />
        </section>
    );
}
