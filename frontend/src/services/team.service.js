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

export async function createTeam(credentials) {
    const response = await laravelClient.post('/teams', credentials);

    return response.data;
}

export async function addTeamMember(teamId, membership) {
    const response = await laravelClient.post(
        `/teams/${teamId}/members`,
        membership,
    );

    return response.data;
}

export async function removeTeamMember(teamId, userId) {
    const response = await laravelClient.delete(
        `/teams/${teamId}/members/${userId}`,
    );

    return response.data;
}
