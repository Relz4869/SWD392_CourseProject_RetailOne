'use client';

import { useEffect, useMemo, useState } from 'react';
import Button from '@/shared/components/Button';
import FormField from '@/shared/components/FormField';
import ErrorMessage from '@/shared/components/ErrorMessage';
import styles from './shiftAssignment.module.css';

export default function AssignShiftForm({
  week,
  staff,
  shifts,
  loading,
  submitting,
  assignmentError,
  success,
  onWeekChange,
  onSubmit,
}) {
  const [form, setForm] = useState({ staffId: '', shiftId: '', workDate: week.from });
  const [validation, setValidation] = useState('');

  useEffect(() => {
    setForm((current) => ({ ...current, workDate: week.from }));
  }, [week.from]);

  const selectedStaff = useMemo(
    () => staff.find((item) => String(item.id) === String(form.staffId)),
    [staff, form.staffId],
  );
  const selectedShift = useMemo(
    () => shifts.find((item) => String(item.id) === String(form.shiftId)),
    [shifts, form.shiftId],
  );
  const ready = Boolean(selectedStaff && selectedShift && form.workDate);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setValidation('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!ready) {
      setValidation('Vui lòng chọn đầy đủ nhân viên, ca và ngày làm việc.');
      return;
    }
    await onSubmit({
      staffId: Number(form.staffId),
      shiftId: Number(form.shiftId),
      workDate: form.workDate,
    });
  };

  const conflict = assignmentError?.code === 'SCHEDULE_OVERLAP'
    ? assignmentError.details
    : null;

  return (
    <section className={styles.formCard} aria-labelledby="assignment-form-title">
      <div className={styles.cardHeading}>
        <div>
          <h2 id="assignment-form-title">Phân ca cho nhân viên</h2>
          <p>Chỉ nhân viên và ca đang hoạt động được hiển thị.</p>
        </div>
        <label className={styles.weekControl}>
          <span>Tuần chứa ngày</span>
          <input
            type="date"
            value={week.from}
            onChange={(event) => onWeekChange(event.target.value)}
            disabled={loading || submitting}
          />
        </label>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <FormField label="Nhân viên đang làm việc *" htmlFor="assignment-staff">
            <select
              id="assignment-staff"
              name="staffId"
              value={form.staffId}
              onChange={update}
              disabled={loading || submitting || staff.length === 0}
            >
              <option value="">Chọn nhân viên</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>{member.fullName}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Ca đang hoạt động *" htmlFor="assignment-shift">
            <select
              id="assignment-shift"
              name="shiftId"
              value={form.shiftId}
              onChange={update}
              disabled={loading || submitting || shifts.length === 0}
            >
              <option value="">Chọn ca</option>
              {shifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.name} ({shift.startTime}–{shift.endTime})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Ngày làm việc *" htmlFor="assignment-date">
            <input
              id="assignment-date"
              name="workDate"
              type="date"
              min={week.from}
              max={week.to}
              value={form.workDate}
              onChange={update}
              disabled={loading || submitting}
            />
          </FormField>
        </div>

        {ready && (
          <div className={styles.summary} role="status">
            <strong>Xác nhận trước khi lưu</strong>
            <span>{selectedStaff.fullName}</span>
            <span>{selectedShift.name}: {selectedShift.startTime}–{selectedShift.endTime}</span>
            <span>Ngày {form.workDate}</span>
          </div>
        )}

        {validation && <ErrorMessage message={validation} inline />}
        {assignmentError && (
          <div className={styles.assignmentError} role="alert">
            <strong>{assignmentError.message}</strong>
            {conflict && (
              <span>
                {conflict.staffName}: {conflict.shiftName} ({conflict.startTime}–{conflict.endTime})
                {' '}ngày {conflict.workDate}.
              </span>
            )}
          </div>
        )}
        {success && (
          <div className={styles.successMessage} role="status">
            Đã phân {success.shiftName} cho {success.staffName} ngày {success.workDate}.
            {success.weeklyHours.warning && <span> {success.weeklyHours.warning}</span>}
          </div>
        )}

        <div className={styles.formActions}>
          <Button type="submit" loading={submitting} disabled={!ready || loading || submitting}>
            Xác nhận phân ca
          </Button>
        </div>
      </form>
    </section>
  );
}
