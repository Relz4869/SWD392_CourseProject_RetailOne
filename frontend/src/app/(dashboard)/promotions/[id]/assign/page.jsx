import { Suspense } from 'react';
import { PromotionAssignmentView } from '@/features/manage-promotion';
import RequireAuth from '@/features/auth/components/RequireAuth';
import Spinner from '@/shared/components/Spinner';
export default function AssignPromotionPage({ params }) {
  return <RequireAuth permission="PROMOTION_ASSIGN_PRODUCT"><Suspense fallback={<Spinner center />}><PromotionAssignmentView promotionId={params.id} /></Suspense></RequireAuth>;
}
