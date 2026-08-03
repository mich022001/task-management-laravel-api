import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import EmptyState from '../components/common/EmptyState.jsx';
import Loading from '../components/common/Loading.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import UserFilters from '../components/users/UserFilters.jsx';
import UserTable from '../components/users/UserTable.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { listUsers, updateUserStatus } from '../services/user.service.js';

const initialFilters = {
    search: '',
    role: '',
    status: '',
};

function getErrorMessage(error, fallbackMessage) {
    return error.response?.data?.message ?? error.message ?? fallbackMessage;
}

export default function Users() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [users, setUsers] = useState([]);
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
    const [updatingUserId, setUpdatingUserId] = useState(null);
    const [successMessage, setSuccessMessage] = useState(() => {
        const message = sessionStorage.getItem('user_success_message');

        sessionStorage.removeItem('user_success_message');

        return message ?? '';
    });

    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        setLoadError('');

        try {
            const response = await listUsers({
                ...appliedFilters,
                page: currentPage,
                per_page: 15,
            });

            setUsers(response.data ?? []);
            setMeta(
                response.meta ?? {
                    current_page: currentPage,
                    last_page: 1,
                    total: 0,
                    per_page: 15,
                },
            );
        } catch (error) {
            setUsers([]);
            setLoadError(
                getErrorMessage(
                    error,
                    'Users could not be retrieved. Please try again.',
                ),
            );
        } finally {
            setIsLoading(false);
        }
    }, [appliedFilters, currentPage]);

    useEffect(() => {
        let ignore = false;

        async function fetchUsers() {
            setIsLoading(true);
            setLoadError('');

            try {
                const response = await listUsers({
                    ...appliedFilters,
                    page: currentPage,
                    per_page: 15,
                });

                if (ignore) {
                    return;
                }

                setUsers(response.data ?? []);
                setMeta(
                    response.meta ?? {
                        current_page: currentPage,
                        last_page: 1,
                        total: 0,
                        per_page: 15,
                    },
                );
            } catch (error) {
                if (ignore) {
                    return;
                }

                setUsers([]);
                setLoadError(
                    getErrorMessage(
                        error,
                        'Users could not be retrieved. Please try again.',
                    ),
                );
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        }

        void fetchUsers();

        return () => {
            ignore = true;
        };
    }, [appliedFilters, currentPage]);

    async function handleStatusChange(user, nextStatus) {
        if (user.id === currentUser?.id) {
            setLoadError(
                'You cannot change the active status of your own account.',
            );

            return;
        }

        setUpdatingUserId(user.id);
        setLoadError('');
        setSuccessMessage('');

        try {
            const response = await updateUserStatus(user.id, nextStatus);

            setUsers((currentUsers) =>
                currentUsers.map((currentUserItem) =>
                    currentUserItem.id === user.id
                        ? {
                              ...currentUserItem,
                              is_active: nextStatus,
                          }
                        : currentUserItem,
                ),
            );

            setSuccessMessage(
                response.message ??
                    `User ${
                        nextStatus ? 'activated' : 'deactivated'
                    } successfully.`,
            );
        } catch (error) {
            setLoadError(
                getErrorMessage(error, 'The user status could not be updated.'),
            );
        } finally {
            setUpdatingUserId(null);
        }
    }

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
                title="Users"
                description="Create accounts, update user details, and manage platform access."
                actions={
                    <button
                        type="button"
                        className="primary-button"
                        onClick={() => navigate('/users/create')}
                    >
                        Add User
                    </button>
                }
            />

            {successMessage ? (
                <p className="success-notification" role="status">
                    {successMessage}
                </p>
            ) : null}

            <UserFilters
                filters={filters}
                onChange={setFilters}
                onSubmit={applyFilters}
                onReset={resetFilters}
            />

            {loadError ? (
                <section className="alert-card alert-card-error" role="alert">
                    <div className="alert-card-content">
                        <h3>Unable to complete the request</h3>
                        <p>{loadError}</p>
                    </div>

                    <button
                        type="button"
                        className="alert-card-action"
                        onClick={() => void loadUsers()}
                    >
                        Retry
                    </button>
                </section>
            ) : null}

            {isLoading ? <Loading message="Loading users..." /> : null}

            {!isLoading && !loadError && users.length === 0 ? (
                <EmptyState
                    title="No users found"
                    description="No user accounts match the selected filters."
                />
            ) : null}

            {!isLoading && users.length > 0 ? (
                <>
                    <UserTable
                        users={users}
                        currentUserId={currentUser?.id}
                        onEdit={(user) => navigate(`/users/${user.id}/edit`)}
                        onStatusChange={handleStatusChange}
                        updatingUserId={updatingUserId}
                    />

                    {meta.last_page > 1 ? (
                        <nav
                            className="pagination"
                            aria-label="User pagination"
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
                                    · {meta.total} users
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
