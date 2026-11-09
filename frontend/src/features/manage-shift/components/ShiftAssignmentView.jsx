'use client';

import PageHeader from '@/shared/components/PageHeader';
import ErrorMessage from '@/shared/components/ErrorMessage';
import EmptyState from '@/shared/components/EmptyState';
import Spinner from '@/shared/components/Spinner';
import AssignShiftForm from './AssignShiftForm';
import WeeklyScheduleGrid from './WeeklyScheduleGrid';
import { useScheduleAssignment } from '../hooks/useScheduleAssignment';
import styles from './shiftAssignment.module.css';

export default function ShiftAssignmentView() {
  const state = useScheduleAssignment();
  const missingOptions = !state.optionsLoading && (state.staff.length === 0 || state.shifts.length === 0);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Phân ca làm việc"
        subtitle="Xếp ca theo ngày cho nhân viên đang hoạt động"
      />

      {state.error && <ErrorMessage message={state.error} onRetry={state.refresh} />}
      {state.optionsLoading && <div className={styles.loadingCard}><Spinner center /></div>}

      {missingOptions && (
        <div className={styles.emptyCard}>
          <EmptyState
            message={state.staff.length === 0
              ? 'Không có nhân viên đang hoạt động để phân ca.'
              : 'Không có ca đang hoạt động. Hãy tạo hoặc kích hoạt ca trước.'}
          />
        </div>
      )}

      {!state.optionsLoading && !missingOptions && (
        <AssignShiftForm
          week={state.week}
          staff={state.staff}
          shifts={state.shifts}
          loading={state.optionsLoading}
          submitting={state.submitting}
          assignmentError={state.assignmentError}
          success={state.success}
          onWeekChange={state.changeWeek}
          onSubmit={state.submitAssignment}
        />
      )}

      <WeeklyScheduleGrid
        week={state.week}
        schedules={state.schedules}
        loading={state.scheduleLoading}
      />
    </div>
  );
}
