import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import EmptyState from '../components/common/EmptyState.jsx';
import Loading from '../components/common/Loading.jsx';
import TeamFilters from '../components/teams/TeamFilters.jsx';
import TeamTable from '../components/teams/TeamTable.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { listTeams } from '../services/team.service.js';

const initialFilters = {
    search: '',
};

function getErrorMessage(error) {
    return (
        error.response?.data?.message ??
        error.message ??
        'Teams could not be retrieved. Please try again.'
    );
}

export default function Teams() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [teams, setTeams] = useState([]);
    const [meta, setMeta] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 15,
    });

    const [filters, setFilters] = useState(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState(initialFilters);
    const [currentPage, setCurrentPage] = useState(1);

    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [successMessage] = useState(() => {
        const message = sessionStorage.getItem('team_success_message');

        sessionStorage.removeItem('team_success_message');

        return message ?? '';
    });

    const loadTeams = useCallback(async () => {
        setIsLoading(true);
        setLoadError('');

        try {
            const response = await listTeams({
                ...appliedFilters,
                page: currentPage,
                per_page: 15,
            });

            setTeams(response.data ?? []);
            setMeta(
                response.meta ?? {
                    current_page: currentPage,
                    last_page: 1,
                    total: 0,
                    per_page: 15,
                },
            );
        } catch (error) {
            setTeams([]);
            setLoadError(getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    }, [appliedFilters, currentPage]);

    useEffect(() => {
        let ignore = false;

        async function fetchTeams() {
            setIsLoading(true);
            setLoadError('');

            try {
                const response = await listTeams({
                    ...appliedFilters,
                    page: currentPage,
                    per_page: 15,
                });

                if (ignore) {
                    return;
                }

                setTeams(response.data ?? []);
                setMeta(
                    response.meta ?? {
                        current_page: currentPage,
                        last_page: 1,
                        total: 0,
                        per_page: 15,
                    },
                );
            } catch (error) {
                if (!ignore) {
                    setTeams([]);
                    setLoadError(getErrorMessage(error));
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        }

        void fetchTeams();

        return () => {
            ignore = true;
        };
    }, [appliedFilters, currentPage]);

    function applyFilters() {
        setCurrentPage(1);
        setAppliedFilters(filters);
    }

    function resetFilters() {
        setFilters(initialFilters);
        setAppliedFilters(initialFilters);
        setCurrentPage(1);
    }

    function changePage(page) {
        if (page < 1 || page > meta.last_page) {
            return;
        }

        setCurrentPage(page);
    }

    return (
        <section>
            <PageHeader
                eyebrow="Administration"
                title="Teams"
                description="Create teams and manage their membership."
                actions={
                    ['admin', 'manager'].includes(currentUser?.role) ? (
                        <button
                            type="button"
                            className="primary-button"
                            onClick={() => navigate('/teams/create')}
                        >
                            Create Team
                        </button>
                    ) : null
                }
            />

            {successMessage ? (
                <p className="success-notification" role="status">
                    {successMessage}
                </p>
            ) : null}

            <TeamFilters
                filters={filters}
                onChange={setFilters}
                onSubmit={applyFilters}
                onReset={resetFilters}
            />

            {loadError ? (
                <section className="alert-card alert-card-error" role="alert">
                    <div className="alert-card-content">
                        <h3>Unable to load teams</h3>
                        <p>{loadError}</p>
                    </div>

                    <button
                        type="button"
                        className="alert-card-action"
                        onClick={() => void loadTeams()}
                    >
                        Retry
                    </button>
                </section>
            ) : null}

            {isLoading ? <Loading message="Loading teams..." /> : null}

            {!isLoading && !loadError && teams.length === 0 ? (
                <EmptyState
                    title="No teams found"
                    description="No teams match the selected search."
                />
            ) : null}

            {!isLoading && teams.length > 0 ? (
                <>
                    <TeamTable
                        teams={teams}
                        onView={(team) => navigate(`/teams/${team.id}`)}
                    />

                    {meta.last_page > 1 ? (
                        <nav
                            className="pagination"
                            aria-label="Team pagination"
                        >
                            <button
                                type="button"
                                className="secondary-button"
                                disabled={meta.current_page <= 1}
                                onClick={() =>
                                    changePage(meta.current_page - 1)
                                }
                            >
                                Previous
                            </button>

                            <p>
                                Page {meta.current_page} of {meta.last_page}
                                <span className="pagination-total">
                                    {' '}
                                    · {meta.total} teams
                                </span>
                            </p>

                            <button
                                type="button"
                                className="secondary-button"
                                disabled={meta.current_page >= meta.last_page}
                                onClick={() =>
                                    changePage(meta.current_page + 1)
                                }
                            >
                                Next
                            </button>
                        </nav>
                    ) : null}
                </>
            ) : null}
        </section>
    );
}
