'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { getProducts } from '../services/product.service';

export function useProductList(role) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse initial state from URL query
  const initialSearch = searchParams.get('search') || '';
  const initialCategoryId = searchParams.get('categoryId') || '';
  const initialStatus = searchParams.get('status') || '';
  const initialSortBy = searchParams.get('sortBy') || 'createdAt';
  const initialSortDir = searchParams.get('sortDir') || 'desc';
  const initialPage = Math.max(1, parseInt(searchParams.get('page'), 10) || 1);
  const initialPageSize = Math.max(1, parseInt(searchParams.get('pageSize'), 10) || 20);

  const [filters, setFilters] = useState({
    search: initialSearch,
    categoryId: initialCategoryId,
    status: initialStatus,
    sortBy: initialSortBy,
    sortDir: initialSortDir,
  });

  const [page, setPageState] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [data, setData] = useState({ items: [], totalItems: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const searchImmediateRef = useRef(false);

  // Sync state to URL
  const updateUrl = useCallback(
    (newFilters, newPage, newPageSize) => {
      const params = new URLSearchParams();
      if (newFilters.search) params.set('search', newFilters.search);
      if (newFilters.categoryId) params.set('categoryId', newFilters.categoryId);
      if (newFilters.status) params.set('status', newFilters.status);
      if (newFilters.sortBy && newFilters.sortBy !== 'createdAt') params.set('sortBy', newFilters.sortBy);
      if (newFilters.sortDir && newFilters.sortDir !== 'desc') params.set('sortDir', newFilters.sortDir);
      if (newPage > 1) params.set('page', String(newPage));
      if (newPageSize !== 20) params.set('pageSize', String(newPageSize));

      const queryStr = params.toString();
      const targetUrl = queryStr ? `${pathname}?${queryStr}` : pathname;
      router.replace(targetUrl, { scroll: false });
    },
    [pathname, router],
  );

  const fetchData = useCallback(
    async (currentFilters, currentPage, currentPageSize) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const queryParams = {
          search: currentFilters.search || undefined,
          categoryId: currentFilters.categoryId || undefined,
          status: currentFilters.status || undefined,
          sortBy: currentFilters.sortBy || undefined,
          sortDir: currentFilters.sortDir || undefined,
          page: currentPage,
          pageSize: currentPageSize,
        };

        const result = await getProducts(queryParams, { signal: controller.signal });
        if (result && Array.isArray(result.items)) {
          setData({
            items: result.items,
            totalItems: result.totalItems || 0,
            totalPages: result.totalPages || 0,
          });
        }
      } catch (err) {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
          setError(err.message || 'Không thể tải danh sách sản phẩm');
        }
      } finally {
        if (abortControllerRef.current === controller) {
          setLoading(false);
        }
      }
    },
    [],
  );

  // Effect to trigger search with 300ms debounce on filters.search
  useEffect(() => {
    updateUrl(filters, page, pageSize);

    if (searchImmediateRef.current) {
      searchImmediateRef.current = false;
      fetchData(filters, page, pageSize);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchData(filters, page, pageSize);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filters, page, pageSize, fetchData, updateUrl]);

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => {
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });
    setPageState(1);
  }, []);

  const searchNow = useCallback((overrideSearch) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    searchImmediateRef.current = true;
    setFilters((prev) => {
      const nextSearch = overrideSearch !== undefined ? overrideSearch : prev.search;
      return { ...prev, search: nextSearch };
    });
    setPageState(1);
  }, []);

  const resetFilters = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    searchImmediateRef.current = true;
    setFilters({
      search: '',
      categoryId: '',
      status: '',
      sortBy: 'createdAt',
      sortDir: 'desc',
    });
    setPageState(1);
  }, []);

  const setPage = useCallback((newPage) => {
    setPageState(newPage);
  }, []);

  const setPageSize = useCallback((newPageSize) => {
    setPageSizeState(newPageSize);
    setPageState(1);
  }, []);

  const reload = useCallback(() => {
    searchImmediateRef.current = true;
    fetchData(filters, page, pageSize);
  }, [fetchData, filters, page, pageSize]);

  return {
    filters,
    setFilter,
    resetFilters,
    searchNow,
    page,
    setPage,
    pageSize,
    setPageSize,
    data,
    loading,
    error,
    reload,
  };
}
