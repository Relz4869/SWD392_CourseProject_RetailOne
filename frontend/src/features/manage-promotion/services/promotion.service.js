import api from '@/shared/services/apiClient';
export const loadPromotions = () => api.get('/promotions');
export const getPromotion = (id) => api.get(`/promotions/${id}`);
export const createPromotion = (data, key) => api.post('/promotions', data, { headers: { 'Idempotency-Key': key } });
export const updateDraft = (id, data) => api.put(`/promotions/${id}/draft`, data);
// Append semantics: removal uses its own immediate DELETE operation.
export const assignTargets = (id, data) => api.put(`/promotions/${id}/targets`, data);
export const removeTarget = (id, targetId) => api.delete(`/promotions/${id}/targets/${targetId}`);
export const deletePromotion = (id) => api.delete(`/promotions/${id}`);
