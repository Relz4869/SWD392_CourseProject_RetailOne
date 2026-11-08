'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import Spinner from '@/shared/components/Spinner';

export default function RequireAuth({ children, permission }) {
  const router = useRouter();
  const { user, permissions, status } = useAuth();

  useEffect(() => {
    if (status === 'guest') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <Spinner center size={32} />;
  }

  if (status === 'guest' || !user) {
    return null;
  }

  if (permission && !permissions.includes(permission)) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-danger-700)' }}>
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  return children;
}
