'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getProductPrice, updateSalePrice as apiUpdateSalePrice } from '../services/product.service';

export function useProductPrice(productId, variantId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const activeControllerRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!productId) return;
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
    }
    const controller = new AbortController();
    activeControllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await getProductPrice(productId, variantId, { signal: controller.signal });
      setData(res);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        setError(err.message || 'Không thể tải thông tin giá bán');
      }
    } finally {
      setLoading(false);
    }
  }, [productId, variantId]);

  useEffect(() => {
    fetchData();
    return () => {
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  const updatePrice = useCallback(
    async (newSalePrice) => {
      if (!data || !data.variant) return;
      setUpdating(true);
      setUpdateError(null);
      setSuccessMsg(null);

      try {
        const res = await apiUpdateSalePrice(productId, data.variant.id, newSalePrice);
        // Cập nhật state trực tiếp
        setData((prev) => {
          if (!prev) return prev;
          const nextVariant = {
            ...prev.variant,
            salePrice: res.variant.salePrice,
          };
          const nextHistory = res.newHistoryEntry
            ? [res.newHistoryEntry, ...(prev.history || [])]
            : prev.history;
          return {
            ...prev,
            variant: nextVariant,
            history: nextHistory,
          };
        });
        setSuccessMsg('Cập nhật giá bán thành công');
        return res;
      } catch (err) {
        if (err.code === 'PRICE_UNCHANGED') {
          setUpdateError('Giá mới phải khác giá hiện tại');
        } else {
          setUpdateError(err.message || 'Không thể cập nhật giá bán');
        }
        throw err;
      } finally {
        setUpdating(false);
      }
    },
    [data, productId]
  );

  const clearSuccessMsg = useCallback(() => setSuccessMsg(null), []);
  const clearUpdateError = useCallback(() => setUpdateError(null), []);

  return {
    data,
    loading,
    error,
    updating,
    updateError,
    successMsg,
    reload: fetchData,
    updatePrice,
    clearSuccessMsg,
    clearUpdateError,
  };
}

