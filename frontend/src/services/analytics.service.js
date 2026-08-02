import nodeClient from '../api/nodeClient.js';

export async function getTaskSummary(parameters = {}) {
    const response = await nodeClient.get('/analytics/tasks/summary', {
        params: parameters,
    });

    return response.data;
}

export async function getUpcomingDeadlines(parameters = {}) {
    const response = await nodeClient.get('/analytics/deadlines/upcoming', {
        params: parameters,
    });

    return response.data;
}
