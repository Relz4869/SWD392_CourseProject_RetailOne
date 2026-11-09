import apiClient from '@/shared/services/apiClient';

/**
 * Lấy danh sách ca làm việc (GET /api/shifts)
 * @param {Object} params { activeOnly?: boolean }
 */
export async function getShifts(params = {}) {
  // apiClient interceptor automatically unwraps response.data.data
  const data = await apiClient.get('/shifts', { params });
  return data;
}

/**
 * Tạo mới ca làm việc (POST /api/shifts)
 * @param {Object} shiftData
 */
export async function createShift(shiftData) {
  const data = await apiClient.post('/shifts', shiftData);
  return data;
}
