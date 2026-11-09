'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/shared/components/DataTable';
import { getVisibleColumns } from '../constants/productColumns';

export default function ProductTable({
  rows = [],
  role,
  sortBy,
  sortDir,
  onSort,
  loading = false,
  emptyContent = null,
}) {
  const router = useRouter();
  const columns = useMemo(() => getVisibleColumns(role), [role]);

  const handleRowClick = (row) => {
    if (!row || !row.id) return;
    const url = row.baseVariantId
      ? `/products/${row.id}/price?variantId=${row.baseVariantId}`
      : `/products/${row.id}/price`;
    router.push(url);
  };

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey="id"
      sortBy={sortBy}
      sortDir={sortDir}
      onSort={onSort}
      onRowClick={handleRowClick}
      loading={loading}
      emptyContent={emptyContent}
    />
  );
}

