import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getToken, clearToken } from '../utils/tokenStorage';
import { getDeviceId } from '../utils/deviceId';

// Single axios instance. Only this file knows the base URL and the token.
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  const deviceId = getDeviceId();
  config.headers = config.headers || {};
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (deviceId) config.headers['X-Device-Id'] = deviceId;
  return config;
});

apiClient.interceptors.response.use(
  // Unwrap { success, data } so callers get data directly.
  (response) => response.data && response.data.data,
  (error) => {
    // Cancelled requests (AbortController) are re-thrown untouched so hooks can ignore them.
    if (axios.isCancel(error)) return Promise.reject(error);

    const status = error.response ? error.response.status : 0;
    const body = (error.response && error.response.data) || {};
    const url = (error.config && error.config.url) || '';

    if (status === 401 && !url.includes('/auth/login') && typeof window !== 'undefined') {
      clearToken();
      window.location.href = '/login?expired=1';
    }

    return Promise.reject({
      status,
      code: body.code || (status ? 'INTERNAL' : 'NETWORK_ERROR'),
      message: body.message || error.message,
      details: body.details,
    });
  },
);

export default apiClient;

