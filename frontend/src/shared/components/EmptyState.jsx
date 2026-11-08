'use client';

import styles from './ui.module.css';

export default function EmptyState({ message = 'Không có dữ liệu', action }) {
  return (
    <div className={styles.empty}>
      <span>{message}</span>
      {action}
    </div>
  );
}

