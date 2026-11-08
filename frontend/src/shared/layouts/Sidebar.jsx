'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './layouts.module.css';
import { filterMenu } from '../routes/menu';

/** Menu filtered by permissions (UI only). Disabled items are dimmed with "Sắp có". */
export default function Sidebar({ permissions = [] }) {
  const pathname = usePathname();
  const items = filterMenu(permissions);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarBrand}>RetailOne POS</div>
      <ul className={styles.menu}>
        {items.map((item) => {
          if (!item.enabled) {
            return (
              <li key={item.uc}>
                <span className={`${styles.menuItem} ${styles.menuDisabled}`} title={`${item.uc} – Sắp có`} aria-disabled="true">
                  {item.label}
                  <span className={styles.soon}>Sắp có</span>
                </span>
              </li>
            );
          }
          const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
          return (
            <li key={item.uc}>
              <Link href={item.path} className={`${styles.menuItem} ${active ? styles.menuActive : ''}`}>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

