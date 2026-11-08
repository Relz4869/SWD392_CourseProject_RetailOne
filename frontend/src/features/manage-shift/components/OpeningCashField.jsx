'use client';

import FormField from '@/shared/components/FormField';
import styles from './checkIn.module.css';

function formatPreview(value) {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return '';
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
    : '';
}

export default function OpeningCashField({ value, onChange, error, disabled }) {
  const preview = formatPreview(value);
  return (
    <FormField label="Tiền đầu ca (VND) *" htmlFor="opening-cash" error={error}>
      <input
        id="opening-cash"
        name="openingCash"
        className={styles.cashInput}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder="Ví dụ: 500000"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={preview ? 'opening-cash-preview' : undefined}
        disabled={disabled}
        autoFocus
      />
      {preview && <span id="opening-cash-preview" className={styles.cashPreview}>{preview}</span>}
      <span className={styles.cashHint}>Tiền đầu ca là bắt buộc trước khi bán hàng. Có thể nhập 0.</span>
    </FormField>
  );
}
