'use client';

import styles from './layouts.module.css';
import Sidebar from './Sidebar';
import Header from './Header';

// Receives user/permissions/onLogout as props. Must NOT import features/auth.
export default function DashboardLayout({ user, permissions = [], onLogout, children }) {
  return (
    <div className={styles.shell}>
      <Sidebar permissions={permissions} />
      <div className={styles.main}>
        <Header user={user} onLogout={onLogout} />
        {user && user.requirePasswordChange && (
          // BR-01: UC71 Change Password comes later; navigation is not blocked yet.
          <div className={styles.banner} role="status">
            Bạn cần đổi mật khẩu trong lần đăng nhập đầu tiên.
          </div>
        )}
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}

