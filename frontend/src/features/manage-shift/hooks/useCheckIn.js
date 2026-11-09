'use client';

import { useCallback, useEffect, useState } from 'react';
import { checkInToShift, getMyTodayShift } from '../services/schedule.service';

export function useCheckIn() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getMyTodayShift());
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải ca làm việc hôm nay');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const checkIn = useCallback(async (scheduleId, openingCash) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = data?.requiresOpeningCash ? { openingCash } : {};
      const session = await checkInToShift(scheduleId, payload);
      setSuccess(session);
      await refresh();
      return { success: true, data: session };
    } catch (requestError) {
      const normalized = {
        code: requestError.code,
        message: requestError.message || 'Không thể bắt đầu ca',
        details: requestError.details,
      };
      setError(normalized.message);
      return { success: false, error: normalized };
    } finally {
      setSubmitting(false);
    }
  }, [data?.requiresOpeningCash, refresh]);

  return { data, loading, submitting, error, success, refresh, checkIn };
}
