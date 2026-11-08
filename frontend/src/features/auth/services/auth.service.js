import apiClient from '@/shared/services/apiClient';

export async function login(username, password) {
  return apiClient.post('/auth/login', { username, password });
}

export async function getMe() {
  return apiClient.get('/auth/me');
}

export const changePassword = (data) => apiClient.post('/auth/change-password',data);
