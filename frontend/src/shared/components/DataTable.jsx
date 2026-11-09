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
  const getSortKey = (col) => (col.sortKey !== undefined ? col.sortKey : col.sortable ? col.key : null);

  const handleSort = (col) => {
    const sortIdentifier = getSortKey(col);
    if (!sortIdentifier || !onSort) return;
    const nextDir = sortBy === sortIdentifier && sortDir === 'asc' ? 'desc' : 'asc';
    onSort(sortIdentifier, nextDir);
  };

  const arrow = (col) => {
    const sortIdentifier = getSortKey(col);
    if (!sortIdentifier) return null;
    if (sortBy !== sortIdentifier) return <span className="text-muted"> ↕</span>;
    return <span>{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>;
  };

  const showEmpty = !loading && rows.length === 0;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => {
              const sortIdentifier = getSortKey(col);
              const isSortable = Boolean(sortIdentifier);
              return (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={[isSortable ? styles.sortable : '', col.align === 'right' ? styles.alignRight : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => isSortable && handleSort(col)}
                  aria-sort={isSortable && sortBy === sortIdentifier ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {col.title}
                  {arrow(col)}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row[rowKey] ?? index}
              className={onRowClick ? styles.clickableRow : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }
                  : undefined
              }
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

