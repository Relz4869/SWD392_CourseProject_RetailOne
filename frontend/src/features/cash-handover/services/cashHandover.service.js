import apiClient from '@/shared/services/apiClient';

export function getCurrentCashHandover() {
  return apiClient.get('/cash-handovers/current');
}

export function submitBlindCount(denominationCounts) {
  return apiClient.post('/cash-handovers/current/count', { denominationCounts });
}

export function getHandoverReport(params) {
  return apiClient.get('/cash-handovers', { params });
}

export function getHandoverDetail(id) {
  return apiClient.get(`/cash-handovers/${id}`);
}
