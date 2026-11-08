'use client';

import styles from './layouts.module.css';

export default function AuthLayout({ title = 'RetailOne POS', subtitle = 'Đăng nhập để tiếp tục', children }) {
  return (
    <main className={styles.authPage}>
      <section className={styles.authCard}>
        <h1 className={styles.brand}>{title}</h1>
        <p className={styles.brandSub}>{subtitle}</p>
        {children}
      </section>
    </main>
  );
}

