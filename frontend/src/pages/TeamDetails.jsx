import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import EmptyState from '../components/common/EmptyState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import Loading from '../components/common/Loading.jsx';
import TeamMemberForm from '../components/teams/TeamMemberForm.jsx';
import TeamMemberTable from '../components/teams/TeamMemberTable.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { useAuth } from '../hooks/useAuth.js';
import {
    addTeamMember,
    getTeam,
    removeTeamMember,
} from '../services/team.service.js';
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

export default function TeamDetails() {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [team, setTeam] = useState(null);
    const [activeUsers, setActiveUsers] = useState([]);

    const isAssignedLead = team?.members?.some(
        (member) =>
            member.id === currentUser?.id && member.member_role === 'lead',
    );

    const canManageMembers =
        currentUser?.role === 'admin' ||
        (currentUser?.role === 'manager' && isAssignedLead);
    const [isLoading, setIsLoading] = useState(true);
    const [pageError, setPageError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [isAddingMember, setIsAddingMember] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [formError, setFormError] = useState('');

    const [updatingMemberId, setUpdatingMemberId] = useState(null);
    const [removingMemberId, setRemovingMemberId] = useState(null);

    useEffect(() => {
        let isCancelled = false;

        async function loadTeamDetails() {
            setIsLoading(true);
            setPageError('');

            try {
                const requests = [getTeam(teamId)];

                if (canManageMembers) {
                    requests.push(
                        listUsers({
                            status: 'active',
                            per_page: 100,
                        }),
                    );
                }

                const [teamResponse, usersResponse] =
                    await Promise.all(requests);

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
                setActiveUsers(usersResponse?.data ?? []);
            } catch (error) {
                if (!isCancelled) {
                    setPageError(
                        getErrorMessage(error, 'The team could not be loaded.'),
                    );
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        }

        void loadTeamDetails();

        return () => {
            isCancelled = true;
        };
    }, [canManageMembers, teamId]);

    const eligibleUsers = useMemo(() => {
        const memberIds = new Set(
            (team?.members ?? []).map((member) => member.id),
        );

        return activeUsers.filter((user) => !memberIds.has(user.id));
    }, [activeUsers, team]);

    async function refreshTeam() {
        const response = await getTeam(teamId);
        const refreshedTeam = response.data?.team;

        if (!refreshedTeam?.id) {
            throw new Error('Laravel returned an invalid team response.');
        }

        setTeam(refreshedTeam);
    }

    async function handleAddMember(payload) {
        setIsAddingMember(true);
        setValidationErrors({});
        setFormError('');
        setSuccessMessage('');

        try {
            const response = await addTeamMember(teamId, payload);

            setTeam(response.data?.team ?? team);
            setSuccessMessage(
                response.message ?? 'Team member added successfully.',
            );
        } catch (error) {
            const errors = normalizeValidationErrors(error);

            setValidationErrors(errors);
            setFormError(
                getErrorMessage(error, 'The team member could not be added.'),
            );
        } finally {
            setIsAddingMember(false);
        }
    }

    async function handleRoleChange(member, nextRole) {
        if (nextRole === member.member_role) {
            return;
        }

        setUpdatingMemberId(member.id);
        setPageError('');
        setSuccessMessage('');

        try {
            const response = await addTeamMember(teamId, {
                user_id: member.id,
                member_role: nextRole,
            });

            setTeam(response.data?.team ?? team);
            setSuccessMessage(
                response.message ?? 'Team membership updated successfully.',
            );
        } catch (error) {
            setPageError(
                getErrorMessage(error, 'The team role could not be updated.'),
            );

            try {
                await refreshTeam();
            } catch {
                // Preserve the original membership error.
            }
        } finally {
            setUpdatingMemberId(null);
        }
    }

    async function handleRemoveMember(member) {
        const confirmed = window.confirm(
            `Remove ${member.name} from ${team.name}?`,
        );

        if (!confirmed) {
            return;
        }

        setRemovingMemberId(member.id);
        setPageError('');
        setSuccessMessage('');

        try {
            const response = await removeTeamMember(teamId, member.id);

            setTeam((currentTeam) => ({
                ...currentTeam,
                members: currentTeam.members.filter(
                    (currentMember) => currentMember.id !== member.id,
                ),
                members_count: Math.max(
                    (currentTeam.members_count ?? 1) - 1,
                    0,
                ),
            }));

            setSuccessMessage(
                response.message ?? 'Team member removed successfully.',
            );
        } catch (error) {
            setPageError(
                getErrorMessage(error, 'The team member could not be removed.'),
            );
        } finally {
            setRemovingMemberId(null);
        }
    }

    return (
        <section>
            <PageHeader
                eyebrow="Team management"
                title={team?.name ?? 'Team Details'}
                description="Review team ownership, membership, and assigned work."
                actions={
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => navigate('/teams')}
                    >
                        Back to Teams
                    </button>
                }
            />

            {isLoading ? <Loading message="Loading team details..." /> : null}

            {!isLoading && pageError && !team ? (
                <ErrorState message={pageError} />
            ) : null}

            {!isLoading && team ? (
                <>
                    {successMessage ? (
                        <p className="success-notification" role="status">
                            {successMessage}
                        </p>
                    ) : null}

                    {pageError ? (
                        <section
                            className="alert-card alert-card-error"
                            role="alert"
                        >
                            <div className="alert-card-content">
                                <h3>Unable to complete the request</h3>
                                <p>{pageError}</p>
                            </div>
                        </section>
                    ) : null}

                    <section className="team-summary-grid">
                        <article className="team-summary-card">
                            <p className="page-eyebrow">Creator</p>
                            <h3>{team.creator?.name ?? 'Unknown'}</h3>
                            <p className="muted-text">
                                {team.creator?.email ?? 'No email'}
                            </p>
                        </article>

                        <article className="team-summary-card">
                            <p className="page-eyebrow">Members</p>
                            <h3>{team.members_count ?? 0}</h3>
                            <p className="muted-text">Assigned team accounts</p>
                        </article>

                        <article className="team-summary-card">
                            <p className="page-eyebrow">Tasks</p>
                            <h3>{team.tasks_count ?? 0}</h3>
                            <p className="muted-text">
                                Tasks assigned to this team
                            </p>
                        </article>
                    </section>

                    {canManageMembers ? (
                        <section className="admin-form-panel">
                            <div className="admin-form-panel-header">
                                <div>
                                    <p className="page-eyebrow">Membership</p>
                                    <h3>Add Team Member</h3>
                                </div>
                            </div>

                            {formError ? (
                                <p className="error-message" role="alert">
                                    {formError}
                                </p>
                            ) : null}

                            {eligibleUsers.length > 0 ? (
                                <TeamMemberForm
                                    key={team.members
                                        .map((member) => member.id)
                                        .join('-')}
                                    eligibleUsers={eligibleUsers}
                                    isSubmitting={isAddingMember}
                                    validationErrors={validationErrors}
                                    onSubmit={handleAddMember}
                                />
                            ) : (
                                <p className="muted-text">
                                    No active users are currently available for
                                    assignment.
                                </p>
                            )}
                        </section>
                    ) : null}

                    <section className="team-members-section">
                        <div className="team-section-heading">
                            <div>
                                <p className="page-eyebrow">Team membership</p>
                                <h3>Members</h3>
                            </div>
                        </div>

                        {team.members?.length > 0 ? (
                            <TeamMemberTable
                                members={team.members}
                                creatorId={team.creator?.id}
                                canManageMembers={canManageMembers}
                                updatingMemberId={updatingMemberId}
                                removingMemberId={removingMemberId}
                                onRoleChange={handleRoleChange}
                                onRemove={handleRemoveMember}
                            />
                        ) : (
                            <EmptyState
                                title="No team members"
                                description="This team does not have assigned members."
                            />
                        )}
                    </section>
                </>
            ) : null}
        </section>
    );
}
