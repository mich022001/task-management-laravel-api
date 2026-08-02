import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ErrorState from '../components/common/ErrorState.jsx';
import Loading from '../components/common/Loading.jsx';
import TaskForm from '../components/tasks/TaskForm.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { getTask, updateTask } from '../services/task.service.js';
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
        'The task could not be updated. Please try again.'
    );
}

function formatDateInput(value) {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toISOString().slice(0, 10);
}

function mapTaskToValues(task) {
    return {
        title: task.title ?? '',
        description: task.description ?? '',
        priority: task.priority ?? '',
        team_id: task.team_id ? String(task.team_id) : '',
        assigned_to: task.assigned_to ? String(task.assigned_to) : '',
        due_date: formatDateInput(task.due_date),
    };
}

function buildPayload(values) {
    return {
        title: values.title.trim(),
        description: values.description.trim() || null,
        priority: values.priority,
        team_id: values.team_id,
        assigned_to: values.assigned_to || null,
        due_date: values.due_date || null,
    };
}

export default function EditTask() {
    const { taskId } = useParams();
    const navigate = useNavigate();

    const [values, setValues] = useState({
        ...initialValues,
    });

    const [teams, setTeams] = useState([]);
    const [members, setMembers] = useState([]);
    const [errors, setErrors] = useState({});
    const [pageError, setPageError] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        let isCancelled = false;

        Promise.all([
            getTask(taskId),
            listTeams({
                per_page: 100,
            }),
        ])
            .then(async ([taskResponse, teamResponse]) => {
                if (isCancelled) {
                    return;
                }

                const task = taskResponse.data?.task;

                if (!task?.id) {
                    throw new Error(
                        'Laravel returned an invalid task response.',
                    );
                }

                const nextValues = mapTaskToValues(task);

                setValues(nextValues);
                setTeams(teamResponse.data ?? []);

                if (!nextValues.team_id) {
                    return;
                }

                const selectedTeamResponse = await getTeam(nextValues.team_id);

                if (!isCancelled) {
                    setMembers(selectedTeamResponse.data?.team?.members ?? []);
                }
            })
            .catch((error) => {
                if (!isCancelled) {
                    setPageError(getApiErrorMessage(error));
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
    }, [taskId]);

    useEffect(() => {
        if (!values.team_id || isLoading) {
            return undefined;
        }

        let isCancelled = false;

        getTeam(values.team_id)
            .then((response) => {
                if (!isCancelled) {
                    setMembers(response.data?.team?.members ?? []);
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
    }, [isLoading, values.team_id]);

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
            const response = await updateTask(taskId, buildPayload(values));

            sessionStorage.setItem(
                'task_success_message',
                response.message ?? 'Task updated successfully.',
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
                title="Edit Task"
                description="Update task details and assignment information."
            />

            {isLoading ? (
                <Loading message="Loading task..." variant="form" />
            ) : null}

            {!isLoading && pageError ? (
                <ErrorState message={pageError} />
            ) : null}

            {!isLoading && !pageError ? (
                <TaskForm
                    values={values}
                    teams={teams}
                    members={members}
                    errors={errors}
                    isSubmitting={isSubmitting}
                    isLoadingMembers={isLoadingMembers}
                    submitLabel="Save Changes"
                    onChange={updateValues}
                    onSubmit={submitTask}
                    onCancel={() => navigate('/tasks')}
                />
            ) : null}
        </section>
    );
}
