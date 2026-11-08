'use client';

import { useState, useEffect, useCallback } from 'react';
import { getShifts, createShift as createShiftApi } from '../services/shift.service';

export function useShifts() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getShifts();
      setShifts(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err.message || 'Không thể tải danh sách ca';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const addShift = async (shiftData) => {
    setSubmitting(true);
    try {
      const createdData = await createShiftApi(shiftData);
      await fetchShifts();
      return { success: true, data: createdData };
    } catch (err) {
      return {
        success: false,
        code: err.code,
        message: err.message || 'Lỗi khi tạo ca làm việc',
        details: err.details,
      };
    } finally {
      setSubmitting(false);
    }
  };

  return {
    shifts,
    loading,
    error,
    submitting,
    refreshShifts: fetchShifts,
    addShift,
  };
}
