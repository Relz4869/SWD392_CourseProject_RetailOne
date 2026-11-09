'use client';

import RequireAuth from '@/features/auth/components/RequireAuth';
import ShiftAssignmentView from '@/features/manage-shift/components/ShiftAssignmentView';
import { PERMISSIONS } from '@/shared/constants/permissions';

export default function SchedulesPage() {
  return (
    <RequireAuth permission={PERMISSIONS.SHIFT_ASSIGN}>
      <ShiftAssignmentView />
    </RequireAuth>
  );
}
