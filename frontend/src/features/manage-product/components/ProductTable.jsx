'use client';

import { useMemo } from 'react';
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
  const columns = useMemo(() => getVisibleColumns(role), [role]);

  const handleRowClick = (row) => {
    // TODO UC49: Navigate to Product Detail view
    console.log('Selected product id:', row.id);
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

