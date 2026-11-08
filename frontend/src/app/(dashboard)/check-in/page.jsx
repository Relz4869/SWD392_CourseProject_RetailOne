'use client';

import RequireAuth from '@/features/auth/components/RequireAuth';
import CheckInView from '@/features/manage-shift/components/CheckInView';
import { PERMISSIONS } from '@/shared/constants/permissions';

export default function CheckInPage() {
  return (
    <RequireAuth permission={PERMISSIONS.SHIFT_CHECKIN}>
      <CheckInView />
    </RequireAuth>
  );
}
