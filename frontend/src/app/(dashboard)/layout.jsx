'use client';

import { RequireAuth, useAuth } from '@/features/auth';
import DashboardLayout from '@/shared/layouts/DashboardLayout';

export default function Layout({ children }) {
  return (
    <RequireAuth>
      <Shell>{children}</Shell>
    </RequireAuth>
  );
}

function Shell({ children }) {
  const { user, permissions, logout } = useAuth();
  return (
    <DashboardLayout user={user} permissions={permissions} onLogout={logout}>
      {children}
    </DashboardLayout>
  );
}
