'use client';

import DashboardLayout from '@/shared/layouts/DashboardLayout';

// Placeholder shell. TODO UC69 (Phase 3): <RequireAuth> + user/permissions from useAuth().
export default function Layout({ children }) {
  return (
    <DashboardLayout user={null} permissions={[]} onLogout={() => {}}>
      {children}
    </DashboardLayout>
  );
}

