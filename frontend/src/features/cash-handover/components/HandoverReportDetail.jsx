'use client';

import { useEffect } from 'react';
import ErrorMessage from '@/shared/components/ErrorMessage';
import Spinner from '@/shared/components/Spinner';
import styles from './handoverReport.module.css';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });

export default function HandoverReportDetail({ detail, loading, error, onClose }) {
  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  if (!detail) return null;
  const variance = Number(detail.variance || 0);

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={styles.detailPanel} role="dialog" aria-modal="true" aria-labelledby="handover-detail-title">
        <header>
          <div>
            <span className={styles.eyebrow}>Bàn giao đã hoàn tất</span>
            <h2 id="handover-detail-title">Chi tiết #{detail.id}</h2>
          </div>
          <button className={styles.closeButton} type="button" aria-label="Đóng" onClick={onClose}>×</button>
        </header>

        {loading && <Spinner center />}
        {error && <ErrorMessage message={error} />}
        {!loading && !error && detail.handoverTime && (
          <div className={styles.detailBody}>
            <dl className={styles.detailGrid}>
              <div><dt>Nhân viên</dt><dd>{detail.staffName}</dd></div>
              <div><dt>Ca làm việc</dt><dd>{detail.shiftName || '—'}</dd></div>
              <div><dt>Thời điểm</dt><dd>{dateTime.format(new Date(detail.handoverTime))}</dd></div>
              <div><dt>Trạng thái duyệt</dt><dd>{detail.reviewStatus === 'Reviewed' ? 'Đã duyệt' : 'Chờ duyệt'}</dd></div>
              <div><dt>Tiền đầu ca</dt><dd>{money.format(Number(detail.openingCash))}</dd></div>
              <div><dt>Tiền ghi nhận từ hệ thống</dt><dd>{money.format(Number(detail.systemCash))}</dd></div>
              <div><dt>Tiền thực tế</dt><dd>{money.format(Number(detail.actualCash))}</dd></div>
              <div>
                <dt>Chênh lệch</dt>
                <dd className={variance === 0 ? styles.balanced : styles.discrepancy}>
                  {variance > 0 ? '+' : ''}{money.format(variance)}
                </dd>
              </div>
            </dl>

            <div className={styles.noteBlock}>
              <strong>Ghi chú bàn giao</strong>
              <p>{detail.note || 'Không có ghi chú.'}</p>
            </div>

            <div className={styles.noteBlock}>
              <strong>Kiểm đếm mệnh giá</strong>
              {detail.denominations?.length ? (
                <ul>{detail.denominations.map((item) => <li key={item.denomination}>{money.format(Number(item.denomination))}: {item.quantity}</li>)}</ul>
              ) : <p>Bàn giao lịch sử này không có dữ liệu chi tiết mệnh giá.</p>}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
