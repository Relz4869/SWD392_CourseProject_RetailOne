'use client';

import styles from './ui.module.css';
import Button from './Button';

/** inline = small red box (forms); otherwise a centered block with an optional "Thử lại" button. */
export default function ErrorMessage({ message, details, onRetry, inline = false }) {
  if (!message) return null;

  let detailText = '';
  if (details) {
    if (typeof details === 'object') {
      detailText = Object.entries(details)
        .map(([field, err]) => `${field}: ${err}`)
        .join(', ');
    } else {
      detailText = String(details);
    }
  }

  const displayText = detailText ? `${message} (${detailText})` : message;

  if (inline) {
    return (
      <div className={styles.errorInline} role="alert">
        {displayText}
      </div>
    );
  }
  return (
    <div className={styles.error} role="alert">
      <span>{displayText}</span>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}
