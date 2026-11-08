'use client';

import { useCallback, useEffect, useState } from 'react';
import { getCurrentCashHandover, submitBlindCount } from '../services/cashHandover.service';

export function useCashHandover() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getCurrentCashHandover());
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải phiên bàn giao tiền');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const submitCount = useCallback(async (counts) => {
    setSubmitting(true);
    setError(null);
    try {
      await submitBlindCount(counts);
      await refresh();
      return true;
    } catch (requestError) {
      setError(requestError.message || 'Không thể lưu kết quả kiểm đếm');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [refresh]);

  return { data, loading, submitting, error, refresh, submitCount };
}
