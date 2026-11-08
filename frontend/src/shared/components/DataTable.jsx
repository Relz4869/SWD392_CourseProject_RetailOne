'use client';

import styles from './ui.module.css';
import Spinner from './Spinner';

/*
 * columns: [{ key, title, sortable, align, width, render(row) }]
 * sortBy/sortDir/onSort: controlled sorting (header click toggles asc/desc).
 * loading: keeps the current rows and shows an overlay spinner.
 */
export default function DataTable({
  columns,
  rows = [],
  rowKey = 'id',
  sortBy,
  sortDir,
  onSort,
  onRowClick,
  loading = false,
  emptyContent = null,
}) {
  const handleSort = (col) => {
    if (!col.sortable || !onSort) return;
    const nextDir = sortBy === col.key && sortDir === 'asc' ? 'desc' : 'asc';
    onSort(col.key, nextDir);
  };

  const arrow = (col) => {
    if (!col.sortable) return null;
    if (sortBy !== col.key) return <span className="text-muted"> ↕</span>;
    return <span>{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>;
  };

  const showEmpty = !loading && rows.length === 0;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
                className={[col.sortable ? styles.sortable : '', col.align === 'right' ? styles.alignRight : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleSort(col)}
                aria-sort={sortBy === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
              >
                {col.title}
                {arrow(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row[rowKey] ?? index}
              className={onRowClick ? styles.clickableRow : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} className={col.align === 'right' ? styles.alignRight : undefined}>
                  {col.render ? col.render(row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
          {loading && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length}>
                <Spinner center />
              </td>
            </tr>
          )}
          {showEmpty && emptyContent && (
            <tr>
              <td colSpan={columns.length}>{emptyContent}</td>
            </tr>
          )}
        </tbody>
      </table>
      {loading && rows.length > 0 && (
        <div className={styles.tableOverlay}>
          <Spinner size={28} />
        </div>
      )}
    </div>
  );
}

