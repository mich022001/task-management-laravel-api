import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ErrorState from '../components/common/ErrorState.jsx';
import Loading from '../components/common/Loading.jsx';
import TeamForm from '../components/teams/TeamForm.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { createTeam } from '../services/team.service.js';
import { listUsers } from '../services/user.service.js';

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

function getErrorMessage(error, fallbackMessage) {
    return error.response?.data?.message ?? error.message ?? fallbackMessage;
}

export default function CreateTeam() {
    const navigate = useNavigate();

    const [managers, setManagers] = useState([]);
    const [isLoadingManagers, setIsLoadingManagers] = useState(true);

    const [validationErrors, setValidationErrors] = useState({});
    const [pageError, setPageError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        let isCancelled = false;

        listUsers({
            role: 'manager',
            status: 'active',
            per_page: 100,
        })
            .then((response) => {
                if (!isCancelled) {
                    setManagers(response.data ?? []);
                    setPageError('');
                }
            })
            .catch((error) => {
                if (!isCancelled) {
                    setManagers([]);
                    setPageError(
                        getErrorMessage(
                            error,
                            'Manager accounts could not be loaded.',
                        ),
                    );
                }
            })
            .finally(() => {
                if (!isCancelled) {
                    setIsLoadingManagers(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, []);

    async function handleSubmit(payload) {
        setIsSubmitting(true);
        setValidationErrors({});
        setPageError('');

        try {
            const response = await createTeam(payload);

            sessionStorage.setItem(
                'team_success_message',
                response.message ?? 'Team created successfully.',
            );

            navigate('/teams', {
                replace: true,
            });
        } catch (error) {
            const errors = normalizeValidationErrors(error);

            setValidationErrors(errors);

            if (Object.keys(errors).length === 0) {
                setPageError(
                    getErrorMessage(error, 'The team could not be created.'),
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <section>
            <PageHeader
                eyebrow="Administration"
                title="Create Team"
                description="Create a team and assign its operational manager."
            />

            {isLoadingManagers ? (
                <Loading message="Loading team form..." variant="form" />
            ) : null}

            {!isLoadingManagers && pageError ? (
                <ErrorState message={pageError} />
            ) : null}

            {!isLoadingManagers && !pageError && managers.length === 0 ? (
                <ErrorState message="No active Manager account is available. Create or activate a Manager before creating a team." />
            ) : null}

            {!isLoadingManagers && !pageError && managers.length > 0 ? (
                <TeamForm
                    managers={managers}
                    isSubmitting={isSubmitting}
                    validationErrors={validationErrors}
                    onSubmit={handleSubmit}
                    onCancel={() => navigate('/teams')}
                />
            ) : null}
        </section>
    );
}
