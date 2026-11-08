'use client';

import styles from './layouts.module.css';
import Button from '../components/Button';
import { ROLE_LABELS } from '../constants/roles';

export default function Header({ user, onLogout }) {
  return (
    <header className={styles.header}>
      {user && (
        <div className={styles.userInfo}>
          <span className={styles.userName}>{user.fullName || user.username}</span>
          <span className={styles.userRole}>{ROLE_LABELS[user.role] || user.role}</span>
        </div>
      )}
      <Button variant="secondary" onClick={onLogout}>
        Đăng xuất
      </Button>
    </header>
  );
}

