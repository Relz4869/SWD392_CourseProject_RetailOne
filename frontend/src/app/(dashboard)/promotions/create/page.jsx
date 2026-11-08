import { Suspense } from 'react';
import { PromotionFormView } from '@/features/manage-promotion';
import RequireAuth from '@/features/auth/components/RequireAuth';
import Spinner from '@/shared/components/Spinner';
export default function CreatePromotionPage() {
  return <RequireAuth permission="PROMOTION_CREATE"><Suspense fallback={<Spinner center />}><PromotionFormView /></Suspense></RequireAuth>;
}
