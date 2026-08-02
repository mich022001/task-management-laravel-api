import axios from 'axios';

import {
    clearAccessToken,
    getAccessToken,
    notifyUnauthorized,
} from '../utils/authSession.js';

const nodeApiUrl = import.meta.env.VITE_NODE_API_URL;

if (!nodeApiUrl) {
    throw new Error('VITE_NODE_API_URL is not configured.');
}

export const nodeClient = axios.create({
    baseURL: nodeApiUrl,
    timeout: 15_000,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
});

nodeClient.interceptors.request.use(
    (config) => {
        const accessToken = getAccessToken();

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => Promise.reject(error),
);

nodeClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            clearAccessToken();
            notifyUnauthorized();
        }

        return Promise.reject(error);
    },
);

export default nodeClient;
