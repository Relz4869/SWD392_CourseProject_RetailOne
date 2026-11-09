'use client';

import RequireAuth from '@/features/auth/components/RequireAuth';
import { useAuth } from '@/features/auth/components/AuthProvider';
import CashHandoverView from '@/features/cash-handover/components/CashHandoverView';
import HandoverReportView from '@/features/cash-handover/components/HandoverReportView';
import { PERMISSIONS } from '@/shared/constants/permissions';

function CashHandoverContent() {
  const { user } = useAuth();

  if (user?.role === 'Manager') {
    return (
      <RequireAuth permission={[PERMISSIONS.CASH_REPORT_VIEW, PERMISSIONS.CASH_HANDOVER_REPORT]}>
        <HandoverReportView />
      </RequireAuth>
    );
  }

  if (user?.role === 'Cashier') {
    return (
      <RequireAuth permission={[PERMISSIONS.SHIFT_CASH_HANDOVER, PERMISSIONS.CASH_HANDOVER_CREATE]}>
        <CashHandoverView />
      </RequireAuth>
    );
  }

  return <div role="alert">Vai trò hiện tại không được truy cập chức năng bàn giao tiền.</div>;
}

export default function CashHandoverPage() {
  return (
    <RequireAuth>
      <CashHandoverContent />
    </RequireAuth>
  );
}
