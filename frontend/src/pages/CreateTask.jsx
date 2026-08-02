import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ErrorState from '../components/common/ErrorState.jsx';
import Loading from '../components/common/Loading.jsx';
import TaskForm from '../components/tasks/TaskForm.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { createTask } from '../services/task.service.js';
import { getTeam, listTeams } from '../services/team.service.js';

const initialValues = Object.freeze({
    title: '',
    description: '',
    priority: '',
    team_id: '',
    assigned_to: '',
    due_date: '',
});

function validateTask(values) {
    const errors = {};

    if (!values.title.trim()) {
        errors.title = ['The title field is required.'];
    }

    if (values.title.trim().length > 255) {
        errors.title = ['The title must not exceed 255 characters.'];
    }

    if (!values.priority) {
        errors.priority = ['The priority field is required.'];
    }

    if (!values.team_id) {
        errors.team_id = ['The assigned team field is required.'];
    }

    return errors;
}

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

function getApiErrorMessage(error) {
    return (
        error.response?.data?.message ??
        'The task could not be created. Please try again.'
    );
}

function buildPayload(values) {
    return {
        title: values.title.trim(),
        description: values.description.trim() || null,
        priority: values.priority,
        team_id: Number(values.team_id),
        assigned_to: values.assigned_to ? Number(values.assigned_to) : null,
        due_date: values.due_date || null,
    };
}

export default function CreateTask() {
    const navigate = useNavigate();

    const [values, setValues] = useState({
        ...initialValues,
    });

    const [teams, setTeams] = useState([]);
    const [members, setMembers] = useState([]);
    const [errors, setErrors] = useState({});
    const [pageError, setPageError] = useState('');

    const [isLoadingTeams, setIsLoadingTeams] = useState(true);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        let isCancelled = false;

        listTeams({
            per_page: 100,
        })
            .then((response) => {
                if (!isCancelled) {
                    setTeams(response.data ?? []);
                    setPageError('');
                }
            })
            .catch((error) => {
                if (!isCancelled) {
                    setTeams([]);
                    setPageError(getApiErrorMessage(error));
                }
            })
            .finally(() => {
                if (!isCancelled) {
                    setIsLoadingTeams(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!values.team_id) {
            return undefined;
        }

        let isCancelled = false;

        getTeam(values.team_id)
            .then((response) => {
                if (!isCancelled) {
                    const team = response.data?.team;

                    setMembers(team?.members ?? []);
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setMembers([]);
                }
            })
            .finally(() => {
                if (!isCancelled) {
                    setIsLoadingMembers(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [values.team_id]);

    function updateValues(nextValues) {
        const changedField = Object.keys(nextValues).find(
            (field) => nextValues[field] !== values[field],
        );

        const teamChanged = changedField === 'team_id';

        setValues({
            ...nextValues,
            assigned_to: teamChanged ? '' : nextValues.assigned_to,
        });

        if (teamChanged) {
            setMembers([]);
            setIsLoadingMembers(Boolean(nextValues.team_id));
        }

        if (changedField) {
            setErrors((currentErrors) => {
                const nextErrors = {
                    ...currentErrors,
                };

                delete nextErrors[changedField];

                return nextErrors;
            });
        }
    }

    async function submitTask() {
        const clientErrors = validateTask(values);

        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            return;
        }

        setIsSubmitting(true);
        setErrors({});
        setPageError('');

        try {
            const response = await createTask(buildPayload(values));

            sessionStorage.setItem(
                'task_success_message',
                response.message ?? 'Task created successfully.',
            );

            navigate('/tasks', {
                replace: true,
            });
        } catch (error) {
            const validationErrors = normalizeValidationErrors(error);

            setErrors(validationErrors);

            if (Object.keys(validationErrors).length === 0) {
                setPageError(getApiErrorMessage(error));
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <section>
            <PageHeader
                eyebrow="Task workflow"
                title="Create Task"
                description="Create a task and assign it to an authorized team."
            />

            {isLoadingTeams ? (
                <Loading message="Loading task form..." variant="form" />
            ) : null}

            {!isLoadingTeams && pageError ? (
                <ErrorState message={pageError} />
            ) : null}

            {!isLoadingTeams && !pageError ? (
                <TaskForm
                    values={values}
                    teams={teams}
                    members={members}
                    errors={errors}
                    isSubmitting={isSubmitting}
                    isLoadingMembers={isLoadingMembers}
                    onChange={updateValues}
                    onSubmit={submitTask}
                    onCancel={() => navigate('/tasks')}
                />
            ) : null}
        </section>
    );
}
