'use client';

import { useState } from 'react';
import Button from '@/shared/components/Button';
import FormField from '@/shared/components/FormField';
import styles from './manageShift.module.css';

export default function CreateShiftModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    startTime: '08:00',
    endTime: '16:00',
    checkInStart: '',
    checkInEnd: '',
    checkOutDeadline: '',
    isActive: true,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateClient = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Vui lòng nhập tên ca làm việc';
    } else if (formData.name.trim().length > 50) {
      errors.name = 'Tên ca không được vượt quá 50 ký tự';
    }

    if (!formData.startTime) {
      errors.startTime = 'Vui lòng chọn giờ bắt đầu';
    }
    if (!formData.endTime) {
      errors.endTime = 'Vui lòng chọn giờ kết thúc';
    }

    // BR-76: endTime > startTime
    if (formData.startTime && formData.endTime && formData.endTime <= formData.startTime) {
      errors.endTime = 'Giờ kết thúc phải sau giờ bắt đầu';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    const clientErrors = validateClient();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setIsSubmitting(true);
    const payload = {
      name: formData.name.trim(),
      startTime: formData.startTime,
      endTime: formData.endTime,
      checkInStart: formData.checkInStart || null,
      checkInEnd: formData.checkInEnd || null,
      checkOutDeadline: formData.checkOutDeadline || null,
      isActive: formData.isActive,
    };

    const res = await onCreated(payload);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      if (res.code === 'DUPLICATE_SHIFT_NAME' || res.code === 'DUPLICATE') {
        setFieldErrors((prev) => ({ ...prev, name: 'Tên ca làm việc này đã tồn tại' }));
      } else if (res.code === 'INVALID_TIME_RANGE') {
        setFieldErrors((prev) => ({ ...prev, endTime: res.message }));
      } else {
        setGeneralError(res.message || 'Lỗi khi tạo ca làm việc');
      }
    }
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="create-shift-title">
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 id="create-shift-title" className={styles.modalTitle}>Thêm Ca Làm Việc Mới</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Đóng"
            disabled={isSubmitting}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {generalError && (
              <div className={styles.errorBanner} role="alert">
                {generalError}
              </div>
            )}

            <FormField label="Tên ca làm việc *" htmlFor="shift-name" error={fieldErrors.name}>
              <input
                id="shift-name"
                name="name"
                type="text"
                placeholder="Ví dụ: Ca sáng, Ca tối..."
                value={formData.name}
                onChange={handleChange}
                className={`${styles.inputField} ${fieldErrors.name ? styles.inputError : ''}`}
                maxLength={50}
                disabled={isSubmitting}
                autoFocus
              />
            </FormField>

            <div className={styles.sectionDivider}>Khung giờ làm việc chính thức</div>

            <div className={styles.rowTwo}>
              <FormField label="Giờ bắt đầu *" htmlFor="shift-start" error={fieldErrors.startTime}>
                <input
                  id="shift-start"
                  name="startTime"
                  type="time"
                  step="60"
                  value={formData.startTime}
                  onChange={handleChange}
                  className={`${styles.inputField} ${fieldErrors.startTime ? styles.inputError : ''}`}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label="Giờ kết thúc *" htmlFor="shift-end" error={fieldErrors.endTime}>
                <input
                  id="shift-end"
                  name="endTime"
                  type="time"
                  step="60"
                  value={formData.endTime}
                  onChange={handleChange}
                  className={`${styles.inputField} ${fieldErrors.endTime ? styles.inputError : ''}`}
                  disabled={isSubmitting}
                />
              </FormField>
            </div>

            <div className={styles.sectionDivider}>Cấu hình chấm công (Tùy chọn)</div>

            <div className={styles.rowTwo}>
              <FormField label="Mở check-in từ" htmlFor="checkin-start" error={fieldErrors.checkInStart}>
                <input
                  id="checkin-start"
                  name="checkInStart"
                  type="time"
                  step="60"
                  value={formData.checkInStart}
                  onChange={handleChange}
                  className={styles.inputField}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label="Đóng check-in lúc" htmlFor="checkin-end" error={fieldErrors.checkInEnd}>
                <input
                  id="checkin-end"
                  name="checkInEnd"
                  type="time"
                  step="60"
                  value={formData.checkInEnd}
                  onChange={handleChange}
                  className={styles.inputField}
                  disabled={isSubmitting}
                />
              </FormField>
            </div>

            <FormField label="Hạn chót check-out" htmlFor="checkout-deadline" error={fieldErrors.checkOutDeadline}>
              <input
                id="checkout-deadline"
                name="checkOutDeadline"
                type="time"
                step="60"
                value={formData.checkOutDeadline}
                onChange={handleChange}
                className={styles.inputField}
                disabled={isSubmitting}
              />
            </FormField>
          </div>

          <div className={styles.modalFooter}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Lưu ca làm việc
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
