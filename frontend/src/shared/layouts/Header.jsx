'use client';

import styles from './layouts.module.css';
import Button from '../components/Button';
import { ROLE_LABELS, ROLES } from '../constants/roles';

export default function Header({ user, onLogout }) {
  const getRoleClass = (role) => {
    if (role === ROLES.MANAGER || role === 'Manager') return styles.roleManager;
    if (role === ROLES.CASHIER || role === 'Cashier') return styles.roleCashier;
    if (role === ROLES.WAREHOUSE || role === 'Warehouse Staff' || role === 'Warehouse') return styles.roleWarehouse;
    return styles.roleDefault;
  };

  return (
    <header className={styles.header}>
      {user && (
        <div className={styles.userInfo}>
          <span className={styles.userName}>{user.fullName || user.username}</span>
          <span className={`${styles.roleChip} ${getRoleClass(user.role)}`}>
            {ROLE_LABELS[user.role] || user.role}
          </span>
        </div>
      )}
      <Button variant="secondary" onClick={onLogout}>
        Đăng xuất
      </Button>
    </header>
  );
}
