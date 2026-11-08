'use client';

import styles from './layouts.module.css';

export default function AuthLayout({ title = 'RetailOne POS', subtitle = 'Đăng nhập để tiếp tục', children }) {
  return (
    <main className={styles.authPage}>
      <div className={styles.authHero}>
        <div className={styles.authHeroContent}>
          <h1 className={styles.heroBrand}>{title}</h1>
          <p className={styles.heroTagline}>Hệ thống quản trị bán lẻ &amp; điểm bán chuyên nghiệp</p>
        </div>
      </div>
      <div className={styles.authFormSide}>
        <section className={styles.authCard}>
          <h2 className={styles.brand}>{title}</h2>
          <p className={styles.brandSub}>{subtitle}</p>
          {children}
        </section>
      </div>
    </main>
  );
}
