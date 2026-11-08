import {StaffFormView} from '@/features/manage-staff';
import RequireAuth from '@/features/auth/components/RequireAuth';
export default function CreateStaffPage(){return <RequireAuth permission="STAFF_CREATE"><StaffFormView/></RequireAuth>;}
