import laravelClient from '../api/laravelClient.js';

function removeEmptyParameters(parameters = {}) {
    return Object.fromEntries(
        Object.entries(parameters).filter(
            ([, value]) =>
                value !== undefined && value !== null && value !== '',
        ),
    );
}

export async function listTasks(parameters = {}) {
    const response = await laravelClient.get('/tasks', {
        params: removeEmptyParameters(parameters),
    });

    return response.data;
}

export async function getTask(taskId) {
    const response = await laravelClient.get(`/tasks/${taskId}`);

    return response.data;
}

export async function createTask(payload) {
    const response = await laravelClient.post('/tasks', payload);

    return response.data;
}

export async function updateTask(taskId, payload) {
    const response = await laravelClient.patch(`/tasks/${taskId}`, payload);

    return response.data;
}

export async function updateTaskStatus(taskId, status, note = '') {
    const payload = {
        status,
    };

    const normalizedNote = note.trim();

    if (normalizedNote) {
        payload.note = normalizedNote;
    }

    const response = await laravelClient.patch(
        `/tasks/${taskId}/status`,
        payload,
    );

    return response.data;
}

export async function listTaskComments(taskId) {
    const response = await laravelClient.get(`/tasks/${taskId}/comments`);

    return response.data;
}

export async function createTaskComment(taskId, body) {
    const response = await laravelClient.post(`/tasks/${taskId}/comments`, {
        body: body.trim(),
    });

    return response.data;
}

export async function getTaskActivity(taskId) {
    const response = await laravelClient.get(`/tasks/${taskId}/activity`);

    return response.data;
}

export async function deleteTask(taskId) {
    const response = await laravelClient.delete(`/tasks/${taskId}`);

    return response.data;
}
