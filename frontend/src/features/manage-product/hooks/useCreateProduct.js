'use client';

import { useState, useCallback } from 'react';
import { createProduct } from '../services/product.service';

export function useCreateProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleCreate = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const response = await createProduct(data);
      return response;
    } catch (err) {
      const nextFieldErrors = {};

      if (err.code === 'PRODUCT_CODE_EXISTS') {
        nextFieldErrors.code = 'Mã sản phẩm đã tồn tại';
      } else if (err.code === 'BARCODE_EXISTS') {
        nextFieldErrors.barcode = 'Mã vạch đã tồn tại';
      } else if (err.code === 'CATEGORY_NOT_FOUND') {
        nextFieldErrors.categoryId = 'Không tìm thấy danh mục';
      } else if (err.code === 'CATEGORY_INACTIVE') {
        nextFieldErrors.categoryId = 'Danh mục đang ngừng hoạt động';
      } else if (err.code === 'VALIDATION_FAILED' && err.details && typeof err.details === 'object') {
        for (const [k, v] of Object.entries(err.details)) {
          nextFieldErrors[k] = v;
        }
      } else {
        setError(err.message || 'Không thể tạo sản phẩm');
      }

      setFieldErrors(nextFieldErrors);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearErrors = useCallback(() => {
    setError(null);
    setFieldErrors({});
  }, []);

  return {
    loading,
    error,
    fieldErrors,
    setFieldErrors,
    handleCreate,
    clearErrors,
  };
}
