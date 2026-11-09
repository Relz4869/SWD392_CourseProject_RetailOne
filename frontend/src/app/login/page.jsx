'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/shared/layouts/AuthLayout';
import { LoginForm, useAuth } from '@/features/auth';
import Spinner from '@/shared/components/Spinner';

export default function LoginPage() {
  const router = useRouter();
  const { status, user } = useAuth();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(user?.requirePasswordChange ? '/change-password' : '/products');
    }
  }, [status, router, user]);

  if (status === 'loading') {
    return <Spinner center size={32} />;
  }

  return (
    <AuthLayout title="RetailOne POS" subtitle="Đăng nhập để tiếp tục">
      <LoginForm />
    </AuthLayout>
  );
}
