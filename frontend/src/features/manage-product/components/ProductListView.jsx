'use client';

import PageHeader from '@/shared/components/PageHeader';
import Pagination from '@/shared/components/Pagination';
import ErrorMessage from '@/shared/components/ErrorMessage';
import EmptyState from '@/shared/components/EmptyState';
import Button from '@/shared/components/Button';
import { useProductList } from '../hooks/useProductList';
import { useCategoryOptions } from '../hooks/useCategoryOptions';
import ProductFilterBar from './ProductFilterBar';
import ProductTable from './ProductTable';

export default function ProductListView({ role, permissions = [] }) {
  const {
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
  } = useProductList(role);

  const { options: categories } = useCategoryOptions();

  const handleSort = (key, dir) => {
    setFilter('sortBy', key);
    setFilter('sortDir', dir);
  };

  const emptyContent = (
    <EmptyState
      message="Không tìm thấy sản phẩm phù hợp"
      action={
        <Button variant="secondary" onClick={resetFilters}>
          Xóa bộ lọc
        </Button>
      }
    />
  );

  return (
    <div>
      <PageHeader
        title="Danh sách sản phẩm"
        subtitle={data.totalItems ? `${data.totalItems} sản phẩm` : undefined}
        actions={
          <div>
            {/* TODO UC42 - only if PRODUCT_CREATE */}
          </div>
        }
      />

      <ProductFilterBar
        filters={filters}
        onFilterChange={setFilter}
        onResetFilters={resetFilters}
        onSearchNow={searchNow}
        categories={categories}
        role={role}
      />

      {error ? (
        <ErrorMessage message={error} onRetry={reload} />
      ) : (
        <>
          <ProductTable
            rows={data.items}
            role={role}
            sortBy={filters.sortBy}
            sortDir={filters.sortDir}
            onSort={handleSort}
            loading={loading}
            emptyContent={emptyContent}
          />

          {data.totalItems > 0 && (
            <Pagination
              page={page}
              pageSize={pageSize}
              totalItems={data.totalItems}
              totalPages={data.totalPages}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </>
      )}
    </div>
  );
}

