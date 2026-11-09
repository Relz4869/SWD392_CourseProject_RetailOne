'use client';

import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { SalePriceView } from '@/features/manage-product';

export default function ProductPricePage({ params }) {
  const searchParams = useSearchParams();
  const { permissions } = useAuth();
  const variantId = searchParams.get('variantId') || null;

  return (
    <SalePriceView
      productId={params.id}
      variantId={variantId}
      permissions={permissions}
    />
  );
}

