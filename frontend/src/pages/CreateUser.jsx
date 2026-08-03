import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ErrorState from '../components/common/ErrorState.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import UserForm from '../components/users/UserForm.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { createUser } from '../services/user.service.js';
import { getAssignableUserRoleOptions } from '../utils/userRoleOptions.js';

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
        'The user account could not be created.'
    );
}

export default function CreateUser() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const allowedRoles = getAssignableUserRoleOptions(currentUser?.role);

    const [validationErrors, setValidationErrors] = useState({});
    const [pageError, setPageError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(payload) {
        setIsSubmitting(true);
        setValidationErrors({});
        setPageError('');

        try {
            const response = await createUser(payload);

            sessionStorage.setItem(
                'user_success_message',
                response.message ?? 'User created successfully.',
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
                title="Add User"
                description="Create a new account and configure its platform access."
            />

            {pageError ? <ErrorState message={pageError} /> : null}

            <UserForm
                allowedRoles={allowedRoles}
                isSubmitting={isSubmitting}
                validationErrors={validationErrors}
                onSubmit={handleSubmit}
                onCancel={() => navigate('/users')}
            />
        </section>
    );
}
