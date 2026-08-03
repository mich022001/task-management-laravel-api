import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ErrorState from '../components/common/ErrorState.jsx';
import Loading from '../components/common/Loading.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import UserForm from '../components/users/UserForm.jsx';
import { getUser, updateUser } from '../services/user.service.js';

const allowedRoles = [
    {
        value: 'admin',
        label: 'Admin',
    },
    {
        value: 'manager',
        label: 'Manager',
    },
    {
        value: 'team_member',
        label: 'Team Member',
    },
];

function normalizeValidationErrors(error) {
    const validationErrors = error.response?.data?.errors;

    if (!validationErrors || typeof validationErrors !== 'object') {
        return {};
    }

    return Object.fromEntries(
        Object.entries(validationErrors).map(([field, messages]) => [
            field,
            Array.isArray(messages) ? messages : [String(messages)],
        ]),
    );
}

function getErrorMessage(error) {
    return (
        error.response?.data?.message ??
        error.message ??
        'The user account could not be updated.'
    );
}

export default function EditUser() {
    const { userId } = useParams();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [pageError, setPageError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        let isCancelled = false;

        getUser(userId)
            .then((response) => {
                if (isCancelled) {
                    return;
                }

                const loadedUser = response.data?.user;

                if (!loadedUser?.id) {
                    throw new Error(
                        'Laravel returned an invalid user response.',
                    );
                }

                setUser(loadedUser);
                setPageError('');
            })
            .catch((error) => {
                if (!isCancelled) {
                    setPageError(getErrorMessage(error));
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
    }, [userId]);

    async function handleSubmit(payload) {
        setIsSubmitting(true);
        setValidationErrors({});
        setPageError('');

        try {
            const response = await updateUser(userId, payload);

            sessionStorage.setItem(
                'user_success_message',
                response.message ?? 'User updated successfully.',
            );

            navigate('/users', {
                replace: true,
            });
        } catch (error) {
            const errors = normalizeValidationErrors(error);

            setValidationErrors(errors);

            if (Object.keys(errors).length === 0) {
                setPageError(getErrorMessage(error));
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <section>
            <PageHeader
                eyebrow="Administration"
                title="Edit User"
                description="Update account details and platform access."
            />

            {isLoading ? (
                <Loading message="Loading user..." variant="form" />
            ) : null}

            {!isLoading && pageError ? (
                <ErrorState message={pageError} />
            ) : null}

            {!isLoading && !pageError && user ? (
                <UserForm
                    key={user.id}
                    user={user}
                    allowedRoles={allowedRoles}
                    isSubmitting={isSubmitting}
                    validationErrors={validationErrors}
                    onSubmit={handleSubmit}
                    onCancel={() => navigate('/users')}
                />
            ) : null}
        </section>
    );
}
