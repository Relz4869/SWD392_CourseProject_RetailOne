import {StaffListView} from '@/features/manage-staff';
import RequireAuth from '@/features/auth/components/RequireAuth';

export default function StaffPage() {
  return <RequireAuth permission="STAFF_VIEW"><StaffListView/></RequireAuth>;
}

