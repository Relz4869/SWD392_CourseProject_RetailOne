'use client';

import { useEffect, useState } from 'react';
import ErrorMessage from '@/shared/components/ErrorMessage';
import styles from './handoverReport.module.css';

export default function HandoverReportFilters({ filters, staffOptions = [], loading, onApply, onReset }) {
  const [draft, setDraft] = useState(filters);
  const [validation, setValidation] = useState('');

  useEffect(() => { setDraft(filters); }, [filters]);

  const submit = (event) => {
    event.preventDefault();
    if (!draft.fromDate || !draft.toDate || draft.fromDate > draft.toDate) {
      setValidation('Khoảng ngày không hợp lệ. Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.');
      return;
    }
    setValidation('');
    onApply({ fromDate: draft.fromDate, toDate: draft.toDate, staffId: draft.staffId });
  };

  return (
    <form className={styles.filterCard} onSubmit={submit}>
      <div className={styles.filterGrid}>
        <label>
          Từ ngày
          <input type="date" required value={draft.fromDate} onChange={(e) => setDraft({ ...draft, fromDate: e.target.value })} />
        </label>
        <label>
          Đến ngày
          <input type="date" required value={draft.toDate} onChange={(e) => setDraft({ ...draft, toDate: e.target.value })} />
        </label>
        <label>
          Nhân viên
          <select value={draft.staffId} onChange={(e) => setDraft({ ...draft, staffId: e.target.value })}>
            <option value="">Tất cả nhân viên</option>
            {staffOptions.map((staff) => <option key={staff.id} value={staff.id}>{staff.fullName}</option>)}
          </select>
        </label>
        <div className={styles.filterActions}>
          <button type="button" className={styles.resetButton} disabled={loading} onClick={() => { setValidation(''); onReset(); }}>
            Đặt lại
          </button>
          <button type="submit" disabled={loading}>Áp dụng</button>
        </div>
      </div>
      {validation && <ErrorMessage message={validation} inline />}
    </form>
  );
}
