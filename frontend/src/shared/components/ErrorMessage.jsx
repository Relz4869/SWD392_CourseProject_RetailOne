'use client';

import styles from './ui.module.css';
import Button from './Button';

/** inline = small red box (forms); otherwise a centered block with an optional "Thử lại" button. */
export default function ErrorMessage({ message, onRetry, inline = false }) {
  if (!message) return null;
  if (inline) {
    return (
      <div className={styles.errorInline} role="alert">
        {message}
      </div>
    );
  }
  return (
    <div className={styles.error} role="alert">
      <span>{message}</span>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}

