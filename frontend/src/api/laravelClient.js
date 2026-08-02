import axios from 'axios';

import {
    clearAccessToken,
    getAccessToken,
    notifyUnauthorized,
} from '../utils/authSession.js';

const laravelApiUrl = import.meta.env.VITE_LARAVEL_API_URL;

if (!laravelApiUrl) {
    throw new Error('VITE_LARAVEL_API_URL is not configured.');
}

export const laravelClient = axios.create({
    baseURL: laravelApiUrl,
    timeout: 30_000,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
});

laravelClient.interceptors.request.use(
    (config) => {
        const accessToken = getAccessToken();

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => Promise.reject(error),
);

laravelClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            clearAccessToken();
            notifyUnauthorized();
        }

        return Promise.reject(error);
    },
);

export default laravelClient;
