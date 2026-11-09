import { PromotionListView } from '@/features/manage-promotion';
import RequireAuth from '@/features/auth/components/RequireAuth';
import { Suspense } from 'react';
import Spinner from '@/shared/components/Spinner';

export default function PromotionsPage() {
  return <RequireAuth permission="PROMOTION_VIEW"><Suspense fallback={<Spinner center />}><PromotionListView /></Suspense></RequireAuth>;
}

