'use client';

import styles from './ui.module.css';

/** Page numbers with ellipsis: 1 … 4 5 6 … 10 */
function buildPages(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const result = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push(`gap-${p}`);
    result.push(p);
  });
  return result;
}

export default function Pagination({
  page = 1,
  pageSize = 20,
  totalItems = 0,
  totalPages = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
}) {
  const pages = buildPages(page, Math.max(totalPages, 1));
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <nav className={styles.pagination} aria-label="Phân trang">
      <span className="text-muted">
        Hiển thị {from}–{to} / {totalItems}
      </span>
      <div className={styles.pages}>
        <button type="button" className={styles.pageBtn} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Trước
        </button>
        {pages.map((p) =>
          typeof p === 'string' ? (
            <span key={p} className="text-muted">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`${styles.pageBtn} ${p === page ? styles.pageActive : ''}`}
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          className={styles.pageBtn}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Sau
        </button>
      </div>
      {onPageSizeChange && (
        <label className={styles.pageSize}>
          Số dòng
          <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      )}
    </nav>
  );
}

