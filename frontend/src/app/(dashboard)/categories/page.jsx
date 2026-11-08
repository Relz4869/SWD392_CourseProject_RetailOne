'use client';

import { useAuth } from '@/features/auth';
import { CategoryListView } from '@/features/manage-product';

export default function CategoriesPage() {
  const { permissions } = useAuth();
  return <CategoryListView permissions={permissions} />;
}
