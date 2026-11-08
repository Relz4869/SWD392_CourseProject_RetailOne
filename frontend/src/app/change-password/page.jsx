import RequireAuth from '@/features/auth/components/RequireAuth';
import ChangePasswordForm from '@/features/auth/components/ChangePasswordForm';
import AuthLayout from '@/shared/layouts/AuthLayout';
export default function ChangePasswordPage(){return <RequireAuth><AuthLayout subtitle="Đổi mật khẩu tài khoản"><ChangePasswordForm/></AuthLayout></RequireAuth>;}
