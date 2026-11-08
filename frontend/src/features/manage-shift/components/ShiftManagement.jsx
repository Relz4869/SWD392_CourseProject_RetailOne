'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/shared/components/PageHeader';
import Button from '@/shared/components/Button';
import DataTable from '@/shared/components/DataTable';
import EmptyState from '@/shared/components/EmptyState';
import ErrorMessage from '@/shared/components/ErrorMessage';
import { useShifts } from '../hooks/useShifts';
import CreateShiftModal from './CreateShiftModal';
import { useAuth } from '@/features/auth';
import { PERMISSIONS } from '@/shared/constants/permissions';
import { PATHS } from '@/shared/routes/paths';
import styles from './manageShift.module.css';

export default function ShiftManagement() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const { shifts, loading, error, refreshShifts, addShift } = useShifts();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    {
      key: 'name',
      title: 'Tên ca',
      render: (row) => <strong>{row.name}</strong>,
    },
    {
      key: 'time',
      title: 'Khung giờ chính thức',
      render: (row) => (
        <span className={styles.timeTag}>
          {row.startTime} – {row.endTime}
        </span>
      ),
    },
    {
      key: 'checkInWindow',
      title: 'Cửa sổ Check-in',
      render: (row) => {
        if (!row.checkInStart && !row.checkInEnd) {
          return <span style={{ color: 'var(--ink-400)' }}>Mặc định theo giờ ca</span>;
        }
        return (
          <span className={styles.timeTag}>
            {row.checkInStart || '—'} đến {row.checkInEnd || '—'}
          </span>
        );
      },
    },
    {
      key: 'checkOutDeadline',
      title: 'Hạn chót Check-out',
      render: (row) => (
        <span className={styles.timeTag}>
          {row.checkOutDeadline || '—'}
        </span>
      ),
    },
    {
      key: 'isActive',
      title: 'Trạng thái',
      render: (row) => (
        <span className={row.isActive ? styles.statusActive : styles.statusInactive}>
          {row.isActive ? 'Đang kích hoạt' : 'Ngừng sử dụng'}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <PageHeader
        title="Quản lý Ca làm việc"
        subtitle="Định nghĩa ca làm việc và thiết lập khung giờ chấm công"
        actions={(
          <div className={styles.headerActions}>
            {(hasPermission(PERMISSIONS.SHIFT_ASSIGN) || hasPermission(PERMISSIONS.SCHEDULE_ASSIGN)) && (
              <Button variant="secondary" onClick={() => router.push(PATHS.SCHEDULES)}>
                Phân ca
              </Button>
            )}
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              + Tạo ca mới
            </Button>
          </div>
        )}
      />

      {error && <ErrorMessage message={error} onRetry={refreshShifts} />}

      <DataTable
        columns={columns}
        rows={shifts}
        loading={loading}
        emptyContent={
          <EmptyState
            title="Chưa có ca làm việc nào"
            message="Hãy bấm nút 'Tạo ca mới' ở góc phải để bắt đầu thiết lập ca làm việc."
          />
        }
      />

      <CreateShiftModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={addShift}
      />
    </div>
  );
}
