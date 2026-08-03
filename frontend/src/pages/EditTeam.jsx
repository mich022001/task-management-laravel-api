import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ErrorState from '../components/common/ErrorState.jsx';
import Loading from '../components/common/Loading.jsx';
import TeamForm from '../components/teams/TeamForm.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { getTeam, updateTeam } from '../services/team.service.js';
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

export default function EditTeam() {
    const { teamId } = useParams();
    const navigate = useNavigate();

    const [team, setTeam] = useState(null);
    const [managers, setManagers] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [pageError, setPageError] = useState('');
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        let isCancelled = false;

        async function loadPage() {
            setIsLoading(true);
            setPageError('');

            try {
                const [teamResponse, managersResponse] = await Promise.all([
                    getTeam(teamId),
                    listUsers({
                        role: 'manager',
                        status: 'active',
                        per_page: 100,
                    }),
                ]);

                if (isCancelled) {
                    return;
                }

                const loadedTeam = teamResponse.data?.team;

                if (!loadedTeam?.id) {
                    throw new Error(
                        'Laravel returned an invalid team response.',
                    );
                }

                setTeam(loadedTeam);
                setManagers(managersResponse.data ?? []);
            } catch (error) {
                if (!isCancelled) {
                    setPageError(
                        getErrorMessage(
                            error,
                            'The team editing form could not be loaded.',
                        ),
                    );
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        }

        void loadPage();

        return () => {
            isCancelled = true;
        };
    }, [teamId]);

    const initialValues = useMemo(() => {
        const assignedManager = team?.members?.find(
            (member) => member.member_role === 'lead',
        );

        return {
            name: team?.name ?? '',
            manager_id: assignedManager?.id ?? '',
        };
    }, [team]);

    async function handleSubmit(payload) {
        setIsSubmitting(true);
        setValidationErrors({});
        setPageError('');

        try {
            const response = await updateTeam(teamId, payload);
            const updatedTeam = response.data?.team;

            sessionStorage.setItem(
                'team_success_message',
                response.message ?? 'Team updated successfully.',
            );

            navigate(`/teams/${updatedTeam?.id ?? teamId}`, {
                replace: true,
            });
        } catch (error) {
            const errors = normalizeValidationErrors(error);

            setValidationErrors(errors);

            if (Object.keys(errors).length === 0) {
                setPageError(
                    getErrorMessage(error, 'The team could not be updated.'),
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <section>
            <PageHeader
                eyebrow="Team management"
                title="Edit Team"
                description="Update the team name and assigned operational manager."
            />

            {isLoading ? (
                <Loading message="Loading team form..." variant="form" />
            ) : null}

            {!isLoading && pageError && !team ? (
                <ErrorState message={pageError} />
            ) : null}

            {!isLoading && team && managers.length === 0 ? (
                <ErrorState message="No active Manager account is available. Create or activate a Manager before editing this team." />
            ) : null}

            {!isLoading && team && managers.length > 0 ? (
                <>
                    {pageError ? (
                        <p className="error-message" role="alert">
                            {pageError}
                        </p>
                    ) : null}

                    <TeamForm
                        managers={managers}
                        initialValues={initialValues}
                        isSubmitting={isSubmitting}
                        validationErrors={validationErrors}
                        submitLabel="Save changes"
                        submittingLabel="Saving..."
                        onSubmit={handleSubmit}
                        onCancel={() => navigate(`/teams/${teamId}`)}
                    />
                </>
            ) : null}
        </section>
    );
}
