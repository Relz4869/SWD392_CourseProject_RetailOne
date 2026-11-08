'use client';

import React from 'react';
import EmptyState from '@/shared/components/EmptyState';
import styles from './category.module.css';

export default function CategoryTree({ categories = [], loading = false }) {
  if (!loading && categories.length === 0) {
    return <EmptyState message="Chưa có danh mục nào" />;
  }

  return (
    <div className={styles.treeCard}>
      <div className={styles.treeHeader}>
        <span>Tên danh mục</span>
        <span>Trạng thái</span>
      </div>

      <div>
        {categories.map((cat) => {
          const isChild = cat.level === 1;
          const isActive = cat.status === 1 || cat.status === true;

          return (
            <div
              key={cat.id}
              className={`${styles.treeRow} ${isChild ? styles.childRow : ''}`}
            >
              <div className={styles.nameCol}>
                {isChild && <span className={styles.treeIndent}>└</span>}
                <span style={{ fontWeight: isChild ? 400 : 600 }}>{cat.name}</span>
                {!isChild && cat.childCount > 0 && (
                  <span className={styles.childBadge}>({cat.childCount} danh mục con)</span>
                )}
              </div>

              <div className={styles.statusCol}>
                {isActive ? (
                  <span className={styles.badgeActive}>Đang dùng</span>
                ) : (
                  <span className={styles.badgeDisabled}>Đang tắt</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
