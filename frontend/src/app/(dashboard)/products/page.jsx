'use client';

import { useAuth } from '@/features/auth';
import { ProductListView } from '@/features/manage-product';

export default function ProductsPage() {
  const { user, permissions } = useAuth();
  return <ProductListView role={user?.role} permissions={permissions} />;
}
