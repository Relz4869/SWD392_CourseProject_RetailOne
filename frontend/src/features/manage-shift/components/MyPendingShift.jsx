'use client';

import Button from '@/shared/components/Button';
import EmptyState from '@/shared/components/EmptyState';
import styles from './checkIn.module.css';

function formatTime(value) {
  return value ? value.slice(0, 5) : '—';
}

export default function MyPendingShift({ data, onSelect }) {
  if (data.activeSession) {
    const session = data.activeSession;
    return (
      <section className={styles.activeCard} aria-labelledby="active-shift-title">
        <div className={styles.activeBadge}>Đang trong ca</div>
        <h2 id="active-shift-title">{session.shiftName}</h2>
        <p>{session.workDate} · {formatTime(session.startTime)}–{formatTime(session.endTime)}</p>
        <dl className={styles.activeFacts}>
          <div><dt>Check-in thực tế</dt><dd>{new Date(session.actualCheckInAt).toLocaleString('vi-VN')}</dd></div>
          <div><dt>Trạng thái</dt><dd>{session.attendanceRecord === 'Late' ? `Trễ ${session.lateMinutes} phút` : 'Đúng giờ'}</dd></div>
        </dl>
      </section>
    );
  }

  if (!data.pendingShifts?.length) {
    return (
      <section className={styles.emptyCard}>
        <EmptyState message="Hôm nay bạn không có ca đang chờ check-in phù hợp." />
      </section>
    );
  }

  return (
    <div className={styles.shiftList}>
      {data.pendingShifts.map((shift) => (
        <article className={styles.shiftCard} key={shift.scheduleId}>
          <div>
            <p className={styles.eyebrow}>Ca được phân</p>
            <h2>{shift.shiftName}</h2>
            <p className={styles.shiftDate}>{shift.workDate}</p>
          </div>
          <dl className={styles.shiftFacts}>
            <div><dt>Giờ ca</dt><dd>{formatTime(shift.startTime)}–{formatTime(shift.endTime)}</dd></div>
            <div><dt>Khung check-in</dt><dd>{formatTime(shift.checkInStart)}–{formatTime(shift.checkInEnd)}</dd></div>
          </dl>
          {!shift.canCheckIn && (
            <p className={styles.windowMessage} role="status">
              Chưa đến hoặc đã qua khung giờ check-in được cấu hình.
            </p>
          )}
          <Button onClick={() => onSelect(shift)} disabled={!shift.canCheckIn}>
            Bắt đầu ca
          </Button>
        </article>
      ))}
    </div>
  );
}
