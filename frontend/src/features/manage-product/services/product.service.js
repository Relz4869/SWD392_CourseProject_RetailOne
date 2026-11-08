import apiClient from '@/shared/services/apiClient';

export async function getProducts(params = {}, options = {}) {
  const cleanParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value !== null && value !== undefined) {
      cleanParams[key] = value;
    }
  }
  return apiClient.get('/products', {
    params: cleanParams,
    signal: options.signal,
  });
}

export async function createProduct(data, options = {}) {
  return apiClient.post('/products', data, {
    signal: options.signal,
  });
}

export async function getProductPrice(productId, variantId, options = {}) {
  const url = variantId
    ? `/products/${productId}/variants/${variantId}/price`
    : `/products/${productId}/price`;
  return apiClient.get(url, { signal: options.signal });
}

export async function updateSalePrice(productId, variantId, salePrice, options = {}) {
  const url = variantId
    ? `/products/${productId}/variants/${variantId}/price`
    : `/products/${productId}/price`;
  return apiClient.put(url, { salePrice }, { signal: options.signal });
}

