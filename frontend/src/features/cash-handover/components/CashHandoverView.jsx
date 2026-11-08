'use client';

import PageHeader from '@/shared/components/PageHeader';
import Spinner from '@/shared/components/Spinner';
import ErrorMessage from '@/shared/components/ErrorMessage';
import CashCountForm from './CashCountForm';
import { useCashHandover } from '../hooks/useCashHandover';
import styles from './cashHandover.module.css';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

export default function CashHandoverView() {
  const { data, loading, submitting, error, refresh, submitCount } = useCashHandover();
  return (
    <section className={styles.page}>
      <PageHeader title="Bàn giao tiền cuối ca" subtitle="Kiểm đếm tiền thực tế trước khi đối soát hệ thống" />
      {loading && <Spinner center size={32} label="Đang tải phiên bàn giao" />}
      {!loading && error && <ErrorMessage message={error} onRetry={refresh} />}
      {!loading && data && (
        <>
          <div className={styles.contextCard}>
            <div><span>Nhân viên</span><strong>{data.staffName}</strong></div>
            <div><span>Ca làm việc</span><strong>{data.shiftName}</strong></div>
            <div><span>Thời gian</span><strong>{data.startTime}–{data.endTime}</strong></div>
            <div><span>Tiền đầu ca</span><strong>{money.format(Number(data.openingCash))}</strong></div>
          </div>
          {data.stage === 'BLIND_COUNT' ? (
            <CashCountForm denominations={data.denominations} submitting={submitting} onSubmit={submitCount} />
          ) : (
            <div className={styles.completedCard} role="status">
              <span className={styles.step}>Đã lưu kiểm đếm</span>
              <h2>Kết quả kiểm đếm đã được ghi nhận</h2>
              <p>Số tiền bạn vừa đếm: <strong>{money.format(Number(data.actualCash))}</strong>.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
