import nodeClient from '../api/nodeClient.js';

export async function getExportOptions() {
    const response = await nodeClient.get('/export/options');

    return response.data;
}

export async function downloadTasks({ format, team_id, filters = {} }) {
    const response = await nodeClient.post(
        '/export/tasks',
        {
            format,
            team_id: team_id || undefined,
            filters: Object.fromEntries(
                Object.entries(filters).filter(
                    ([, value]) =>
                        value !== undefined && value !== null && value !== '',
                ),
            ),
        },
        {
            responseType: 'blob',
        },
    );

    return {
        blob: response.data,
        contentDisposition: response.headers['content-disposition'] ?? '',
    };
}
