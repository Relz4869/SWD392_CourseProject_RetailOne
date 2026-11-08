'use client';

import styles from './ui.module.css';
import Spinner from './Spinner';

export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  loading = false,
  block = false,
  disabled,
  className = '',
  ...rest
}) {
  const classes = [styles.btn, styles[variant], block ? styles.block : '', className].filter(Boolean).join(' ');
  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading} {...rest}>
      {loading && <Spinner size={16} light={variant === 'primary'} />}
      {children}
    </button>
  );
}

