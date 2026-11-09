'use client';

import RequireAuth from '@/features/auth/components/RequireAuth';
import ShiftManagement from '@/features/manage-shift/components/ShiftManagement';
import CheckInView from '@/features/manage-shift/components/CheckInView';
import { useAuth } from '@/features/auth';
import { ROLES } from '@/shared/constants/roles';

export default function ShiftsPage() {
  return (
    <RequireAuth>
      <RoleShiftPage />
    </RequireAuth>
  );
}

function RoleShiftPage() {
  const { user } = useAuth();
  return [ROLES.CASHIER, ROLES.WAREHOUSE].includes(user?.role)
    ? <CheckInView />
    : <ShiftManagement />;
}
