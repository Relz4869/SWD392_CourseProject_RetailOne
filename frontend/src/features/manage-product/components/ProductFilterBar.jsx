'use client';

import { useEffect, useRef } from 'react';
import Button from '@/shared/components/Button';
import { ROLES } from '@/shared/constants/roles';
import styles from './manage-product.module.css';

export default function ProductFilterBar({
  filters,
  onFilterChange,
  onResetFilters,
  onSearchNow,
  categories = [],
  role,
}) {
  const inputRef = useRef(null);
  const normRole = role === 'Warehouse' ? ROLES.WAREHOUSE : role;
  const canFilterStatus = normRole !== ROLES.CASHIER;

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearchNow(e.target.value);
    }
  };

  const hasActiveFilters = Boolean(filters.search || filters.categoryId || filters.status);

  return (
    <div className={styles.filterBar}>
      <div className={styles.searchInputWrap}>
        <input
          ref={inputRef}
          type="search"
          className={styles.searchInput}
          placeholder="Tìm theo tên, mã SP hoặc quét mã vạch…"
          value={filters.search || ''}
          onChange={(e) => onFilterChange('search', e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </div>

      <select
        className={styles.select}
        value={filters.categoryId || ''}
        onChange={(e) => onFilterChange('categoryId', e.target.value)}
        aria-label="Chọn danh mục"
      >
        <option value="">Tất cả danh mục</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.level === 1 ? `\u00A0\u00A0└ ${cat.name}` : cat.name}
          </option>
        ))}
      </select>

      {canFilterStatus && (
        <select
          className={styles.select}
          value={filters.status || ''}
          onChange={(e) => onFilterChange('status', e.target.value)}
          aria-label="Chọn trạng thái"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Selling">Đang bán</option>
          <option value="StopSelling">Ngừng bán</option>
          <option value="Suspended">Tạm ngưng</option>
        </select>
      )}

      {hasActiveFilters && (
        <Button variant="secondary" onClick={onResetFilters}>
          Xóa bộ lọc
        </Button>
      )}
    </div>
  );
}
