import apiClient from '@/shared/services/apiClient';

export async function getCategories(options = {}) {
  return apiClient.get('/categories', {
    signal: options.signal,
  });
}

export async function createCategory(data, options = {}) {
  return apiClient.post('/categories', data, {
    signal: options.signal,
  });
}

export async function getCategoryOptions(options = {}) {
  return apiClient.get('/categories/options', {
    signal: options.signal,
  });
}
