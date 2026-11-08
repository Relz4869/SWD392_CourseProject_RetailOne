'use client';

import styles from './ui.module.css';

export default function Spinner({ size = 20, light = false, center = false, label = 'Đang tải' }) {
  const el = (
    <span
      role="status"
      aria-label={label}
      className={`${styles.spinner} ${light ? styles.spinnerLight : ''}`}
      style={{ width: size, height: size }}
    />
  );
  return center ? <div className={styles.spinnerCenter}>{el}</div> : el;
}

