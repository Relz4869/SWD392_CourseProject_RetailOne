'use client';

import Spinner from '@/shared/components/Spinner';
import EmptyState from '@/shared/components/EmptyState';
import styles from './shiftAssignment.module.css';

const DAY_NAMES = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

function datesInWeek(from) {
  const start = new Date(`${from}T00:00:00Z`);
  return DAY_NAMES.map((label, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return { label, value: date.toISOString().slice(0, 10) };
  });
}

function Assignment({ item }) {
  return (
    <div className={styles.assignment}>
      <strong>{item.staffName}</strong>
      <span>{item.shiftName}</span>
      <time>{item.startTime.slice(0, 5)}–{item.endTime.slice(0, 5)}</time>
      <small>{item.status}</small>
    </div>
  );
}

export default function WeeklyScheduleGrid({ week, schedules, loading }) {
  const dates = datesInWeek(week.from);

  return (
    <section className={styles.gridCard} aria-labelledby="weekly-grid-title" aria-busy={loading}>
      <div className={styles.gridHeading}>
        <div>
          <h2 id="weekly-grid-title">Lịch tuần</h2>
          <p>{week.from} đến {week.to}</p>
        </div>
        {loading && <Spinner size={24} />}
      </div>

      {!loading && schedules.length === 0 ? (
        <EmptyState message="Chưa có lịch làm việc trong tuần này." />
      ) : (
        <>
          <div className={styles.desktopGrid} role="grid" aria-label="Lịch phân ca theo tuần">
            {dates.map((date) => (
              <div className={styles.dayColumn} role="gridcell" key={date.value}>
                <div className={styles.dayHeader}>
                  <strong>{date.label}</strong>
                  <span>{date.value.slice(5)}</span>
                </div>
                <div className={styles.dayAssignments}>
                  {schedules.filter((item) => item.workDate === date.value).map((item) => (
                    <Assignment key={item.assignmentId} item={item} />
                  ))}
                  {!loading && !schedules.some((item) => item.workDate === date.value) && (
                    <span className={styles.noAssignment}>Trống</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.mobileList}>
            {dates.map((date) => {
              const items = schedules.filter((item) => item.workDate === date.value);
              return (
                <section className={styles.mobileDay} key={date.value}>
                  <h3>{date.label} · {date.value}</h3>
                  {items.length > 0
                    ? items.map((item) => <Assignment key={item.assignmentId} item={item} />)
                    : <span className={styles.noAssignment}>Chưa có ca</span>}
                </section>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
