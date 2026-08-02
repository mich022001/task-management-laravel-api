import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import EmptyState from '../components/common/EmptyState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import Loading from '../components/common/Loading.jsx';
import TaskFilters from '../components/tasks/TaskFilters.jsx';
import TaskPagination from '../components/tasks/TaskPagination.jsx';
import TaskTable from '../components/tasks/TaskTable.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { listTasks } from '../services/task.service.js';
import { listTeams } from '../services/team.service.js';

const TASK_SUCCESS_MESSAGE_KEY = 'task_success_message';

function consumeSuccessMessage() {
    const message = sessionStorage.getItem(TASK_SUCCESS_MESSAGE_KEY) ?? '';

    sessionStorage.removeItem(TASK_SUCCESS_MESSAGE_KEY);

    return message;
}

function getApiErrorMessage(error) {
    const status = error.response?.status;
    const method = error.config?.method?.toUpperCase() ?? 'REQUEST';
    const url = error.config?.url ?? 'unknown endpoint';
    const message =
        error.response?.data?.message ??
        error.message ??
        'Tasks could not be loaded.';

    const requestLabel = `${method} ${url}`;

    return status
        ? `${requestLabel} — HTTP ${status}: ${message}`
        : `${requestLabel} — ${message}`;
}

const emptyFilters = Object.freeze({
    search: '',
    status: '',
    priority: '',
    team_id: '',
});

const initialMeta = {
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
};

function buildTaskParameters(page, filters) {
    return {
        page,
        per_page: 10,
        search: filters.search.trim(),
        status: filters.status,
        priority: filters.priority,
        team_id: filters.team_id,
    };
}

export default function Tasks() {
    const { user, isAuthenticated, isInitializing } = useAuth();

    const canManageTasks = user?.role === 'admin' || user?.role === 'manager';

    const [tasks, setTasks] = useState([]);
    const [teams, setTeams] = useState([]);
    const [meta, setMeta] = useState(initialMeta);
    const [page, setPage] = useState(1);

    const [draftFilters, setDraftFilters] = useState({
        ...emptyFilters,
    });

    const [appliedFilters, setAppliedFilters] = useState({
        ...emptyFilters,
    });

    const [refreshKey, setRefreshKey] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage] = useState(consumeSuccessMessage);

    const retryLoadTasks = useCallback(async () => {
        if (isInitializing || !isAuthenticated || !user) {
            return;
        }

        setIsLoading(true);
        setErrorMessage('');

        try {
            const response = await listTasks(
                buildTaskParameters(page, appliedFilters),
            );

            setTasks(response.data ?? []);
            setMeta(response.meta ?? initialMeta);
        } catch (error) {
            setTasks([]);
            setMeta(initialMeta);
            setErrorMessage(getApiErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    }, [appliedFilters, isAuthenticated, isInitializing, page, user]);

    function changePage(nextPage) {
        setIsLoading(true);
        setErrorMessage('');
        setPage(nextPage);
    }

    function applyFilters() {
        setIsLoading(true);
        setErrorMessage('');
        setPage(1);
        setAppliedFilters({
            ...draftFilters,
        });
        setRefreshKey((currentKey) => currentKey + 1);
    }

    function resetFilters() {
        const resetValues = {
            ...emptyFilters,
        };

        setDraftFilters(resetValues);
        setAppliedFilters(resetValues);
        setPage(1);
        setIsLoading(true);
        setErrorMessage('');
        setRefreshKey((currentKey) => currentKey + 1);
    }

    useEffect(() => {
        if (isInitializing || !isAuthenticated || !user || !canManageTasks) {
            return undefined;
        }

        let isCancelled = false;

        listTeams({
            per_page: 100,
        })
            .then((response) => {
                if (!isCancelled) {
                    setTeams(response.data ?? []);
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setTeams([]);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [canManageTasks, isAuthenticated, isInitializing, user]);

    useEffect(() => {
        if (isInitializing || !isAuthenticated || !user) {
            return undefined;
        }

        let isCancelled = false;

        listTasks(buildTaskParameters(page, appliedFilters))
            .then((response) => {
                if (isCancelled) {
                    return;
                }

                setTasks(response.data ?? []);
                setMeta(response.meta ?? initialMeta);
                setErrorMessage('');
            })
            .catch((error) => {
                if (isCancelled) {
                    return;
                }

                setTasks([]);
                setMeta(initialMeta);
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
    }, [
        appliedFilters,
        isAuthenticated,
        isInitializing,
        page,
        refreshKey,
        user,
    ]);

    return (
        <section>
            <PageHeader
                eyebrow="Task workflow"
                title="Tasks"
                description="Review tasks and open a task to manage its status, comments, and history."
                actions={
                    canManageTasks ? (
                        <Link
                            className="primary-button button-link"
                            to="/tasks/create"
                        >
                            Create Task
                        </Link>
                    ) : null
                }
            />

            {successMessage ? (
                <div className="success-notification" role="status">
                    {successMessage}
                </div>
            ) : null}

            <TaskFilters
                filters={draftFilters}
                teams={teams}
                showTeamFilter={canManageTasks}
                onChange={setDraftFilters}
                onSubmit={applyFilters}
                onReset={resetFilters}
            />

            {isLoading ? (
                <Loading message="Loading tasks..." variant="table" />
            ) : null}

            {!isLoading && errorMessage ? (
                <ErrorState message={errorMessage} onRetry={retryLoadTasks} />
            ) : null}

            {!isLoading && !errorMessage && tasks.length === 0 ? (
                <EmptyState
                    title="No tasks found"
                    message="No tasks match your current filters."
                />
            ) : null}

            {!isLoading && !errorMessage && tasks.length > 0 ? (
                <>
                    <TaskTable tasks={tasks} canEditTasks={canManageTasks} />

                    <TaskPagination
                        currentPage={meta.current_page}
                        lastPage={meta.last_page}
                        total={meta.total}
                        onPageChange={changePage}
                    />
                </>
            ) : null}
        </section>
    );
}
