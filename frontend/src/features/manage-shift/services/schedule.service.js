import apiClient from '@/shared/services/apiClient';

export async function getActiveStaff() {
  return apiClient.get('/staff/active');
}

export async function getWeeklySchedules({ from, to, staffId } = {}) {
  return apiClient.get('/schedules', {
    params: { from, to, ...(staffId ? { staffId } : {}) },
  });
}

export async function assignShift(payload) {
  return apiClient.post('/schedules/assignments', payload);
}

export async function getMyTodayShift() {
  return apiClient.get('/schedules/my-today');
}

export async function checkInToShift(scheduleId, payload = {}) {
  return apiClient.post(`/schedules/${scheduleId}/check-in`, payload);
}
