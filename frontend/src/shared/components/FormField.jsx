'use client';

import styles from './ui.module.css';

export default function FormField({ label, htmlFor, error, children }) {
  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {error && (
        <span className={styles.fieldError} id={htmlFor ? `${htmlFor}-error` : undefined} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

