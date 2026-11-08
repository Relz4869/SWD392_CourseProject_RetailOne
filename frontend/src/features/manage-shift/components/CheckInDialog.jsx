'use client';

import { useEffect, useState } from 'react';
import Button from '@/shared/components/Button';
import ErrorMessage from '@/shared/components/ErrorMessage';
import OpeningCashField from './OpeningCashField';
import styles from './checkIn.module.css';

export default function CheckInDialog({ shift, requiresOpeningCash, submitting, onCancel, onConfirm }) {
  const [openingCash, setOpeningCash] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !submitting) onCancel();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onCancel, submitting]);

  if (!shift) return null;

  const submit = async (event) => {
    event.preventDefault();
    setFieldError('');
    setSubmitError('');
    if (requiresOpeningCash) {
      if (openingCash.trim() === '') {
        setFieldError('Vui lòng nhập tiền đầu ca.');
        return;
      }
      if (!/^(0|[1-9]\d{0,12})(\.\d{1,2})?$/.test(openingCash.trim())) {
        setFieldError('Số tiền phải không âm và có tối đa 2 chữ số thập phân.');
        return;
      }
    }
    const result = await onConfirm(shift.scheduleId, openingCash.trim());
    if (!result.success) {
      if (['OPENING_CASH_REQUIRED', 'OPENING_CASH_INVALID'].includes(result.error.code)) {
        setFieldError(result.error.message);
      } else {
        setSubmitError(result.error.message);
      }
    }
  };

  return (
    <div className={styles.dialogOverlay} role="presentation">
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="check-in-dialog-title"
      >
        <div className={styles.dialogHeader}>
          <div>
            <p className={styles.eyebrow}>Xác nhận bắt đầu ca</p>
            <h2 id="check-in-dialog-title">{shift.shiftName}</h2>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Đóng"
            onClick={onCancel}
            disabled={submitting}
          >×</button>
        </div>

        <form onSubmit={submit}>
          <div className={styles.dialogBody}>
            <dl className={styles.shiftFacts}>
              <div><dt>Ngày làm</dt><dd>{shift.workDate}</dd></div>
              <div><dt>Giờ ca</dt><dd>{shift.startTime}–{shift.endTime}</dd></div>
              <div><dt>Khung check-in</dt><dd>{shift.checkInStart}–{shift.checkInEnd}</dd></div>
            </dl>

            {requiresOpeningCash && (
              <OpeningCashField
                value={openingCash}
                onChange={(value) => { setOpeningCash(value); setFieldError(''); }}
                error={fieldError}
                disabled={submitting}
              />
            )}
            {!requiresOpeningCash && (
              <p className={styles.warehouseNote}>
                Nhân viên kho không khai báo tiền đầu ca.
              </p>
            )}
            {submitError && <ErrorMessage message={submitError} inline />}
          </div>

          <div className={styles.dialogActions}>
            <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
              Hủy
            </Button>
            <Button type="submit" loading={submitting} disabled={submitting}>
              Bắt đầu ca
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
