'use client';

import styles from './ui.module.css';

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className={styles.pageHeader}>
      <div>
        <h1 className={styles.pageTitle}>{title}</h1>
        {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}

