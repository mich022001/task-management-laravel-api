import nodeClient from '../api/nodeClient.js';

export async function getDashboardAnalytics(parameters = {}) {
    const response = await nodeClient.get('/analytics/dashboard', {
        params: parameters,
    });

    return response.data;
}

export async function getTaskSummary(parameters = {}) {
    const response = await nodeClient.get('/analytics/tasks/summary', {
        params: parameters,
    });

    return response.data;
}

export async function getTeamProductivity(teamId) {
    const response = await nodeClient.get(
        `/analytics/teams/${teamId}/productivity`,
    );

    return response.data;
}

export async function getUpcomingDeadlines(parameters = {}) {
    const response = await nodeClient.get('/analytics/deadlines/upcoming', {
        params: parameters,
    });

    return response.data;
}

export async function getTeamHighlights() {
    const response = await nodeClient.get('/analytics/teams/summary');

    return response.data;
}

export async function getTeamReport(teamId, parameters = {}) {
    const response = await nodeClient.get(`/analytics/teams/${teamId}/report`, {
        params: parameters,
    });

    return response.data;
}

export async function downloadTeamReport(format, parameters) {
    const response = await nodeClient.get(`/export/team-report/${format}`, {
        params: parameters,
        responseType: 'blob',
    });

    return {
        blob: response.data,
        contentDisposition: response.headers['content-disposition'] ?? '',
    };
}
