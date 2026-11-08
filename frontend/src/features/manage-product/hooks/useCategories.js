'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCategories, createCategory } from '../services/category.service';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const fetchCategories = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const data = await getCategories({ signal: controller.signal });
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        let msg = err.message || 'Không thể tải danh sách danh mục';
        if (err.details && typeof err.details === 'object') {
          const detailStr = Object.entries(err.details)
            .map(([field, errText]) => `${field}: ${errText}`)
            .join(', ');
          if (detailStr) msg = `${msg} (${detailStr})`;
        }
        setError(msg);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchCategories]);

  const create = useCallback(
    async (payload) => {
      const result = await createCategory(payload);
      await fetchCategories();
      return result;
    },
    [fetchCategories],
  );

  return {
    categories,
    loading,
    error,
    reload: fetchCategories,
    create,
  };
}

