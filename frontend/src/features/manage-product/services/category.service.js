import apiClient from '@/shared/services/apiClient';

export async function getCategoryOptions(options = {}) {
  return apiClient.get('/categories/options', {
    signal: options.signal,
  });
}
