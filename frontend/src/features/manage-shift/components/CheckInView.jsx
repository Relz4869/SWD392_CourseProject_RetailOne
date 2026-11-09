'use client';

import { useState } from 'react';
import PageHeader from '@/shared/components/PageHeader';
import ErrorMessage from '@/shared/components/ErrorMessage';
import Spinner from '@/shared/components/Spinner';
import MyPendingShift from './MyPendingShift';
import CheckInDialog from './CheckInDialog';
import { useCheckIn } from '../hooks/useCheckIn';
import styles from './checkIn.module.css';

export default function CheckInView() {
  const state = useCheckIn();
  const [selectedShift, setSelectedShift] = useState(null);

  const confirm = async (scheduleId, openingCash) => {
    const result = await state.checkIn(scheduleId, openingCash);
    if (result.success) setSelectedShift(null);
    return result;
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Ca làm việc của tôi"
        subtitle="Xem ca được phân và ghi nhận thời gian bắt đầu thực tế"
      />

      {state.loading && <section className={styles.loadingCard}><Spinner center /></section>}
      {state.error && !selectedShift && (
        <ErrorMessage message={state.error} onRetry={state.refresh} />
      )}
      {!state.loading && state.data && (
        <MyPendingShift data={state.data} onSelect={setSelectedShift} />
      )}

      <CheckInDialog
        shift={selectedShift}
        requiresOpeningCash={Boolean(state.data?.requiresOpeningCash)}
        submitting={state.submitting}
        onCancel={() => setSelectedShift(null)}
        onConfirm={confirm}
      />
    </div>
  );
}
