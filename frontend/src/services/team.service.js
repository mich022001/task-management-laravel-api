import laravelClient from '../api/laravelClient.js';

export async function listTeams(parameters = {}) {
    const response = await laravelClient.get('/teams', {
        params: parameters,
    });

    return response.data;
}

export async function getTeam(teamId) {
    const response = await laravelClient.get(`/teams/${teamId}`);

    return response.data;
}
