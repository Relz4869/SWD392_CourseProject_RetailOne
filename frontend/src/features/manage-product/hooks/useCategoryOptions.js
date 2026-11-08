'use client';

import { useState, useEffect } from 'react';
import { getCategoryOptions } from '../services/category.service';

export function useCategoryOptions() {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    async function fetchOptions() {
      setLoading(true);
      setError(null);
      try {
        const data = await getCategoryOptions({ signal: controller.signal });
        if (isMounted && Array.isArray(data)) {
          setOptions(data);
        }
      } catch (err) {
        if (isMounted && err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
          setError(err.message || 'Không thể tải danh mục');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchOptions();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  return { options, loading, error };
}

