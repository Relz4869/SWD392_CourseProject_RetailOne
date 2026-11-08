'use client';

import { useCallback, useEffect, useState } from 'react';
import { getHandoverDetail, getHandoverReport } from '../services/cashHandover.service';

function localDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function initialFilters() {
  const today = new Date();
  return {
    fromDate: localDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    toDate: localDate(today),
    staffId: '',
    page: 1,
    pageSize: 10,
  };
}

export function useHandoverReport() {
  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { ...filters };
      if (!params.staffId) delete params.staffId;
      setData(await getHandoverReport(params));
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải báo cáo bàn giao tiền.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const applyFilters = useCallback((next) => {
    setFilters((current) => ({ ...current, ...next, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => setFilters(initialFilters()), []);

  const changePage = useCallback((page) => setFilters((current) => ({ ...current, page })), []);
  const changePageSize = useCallback((pageSize) => setFilters((current) => ({ ...current, page: 1, pageSize })), []);

  const openDetail = useCallback(async (id) => {
    setDetail({ id });
    setDetailLoading(true);
    setDetailError('');
    try {
      setDetail(await getHandoverDetail(id));
    } catch (requestError) {
      setDetailError(requestError.message || 'Không thể tải chi tiết bàn giao.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setDetail(null);
    setDetailError('');
  }, []);

  return {
    filters, data, loading, error, detail, detailLoading, detailError,
    reload: load, applyFilters, resetFilters, changePage, changePageSize, openDetail, closeDetail,
  };
}

export default useHandoverReport;
