'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/shared/components/Button';
import styles from './sale-price.module.css';

export default function PriceUpdateForm({
  currentPrice = 0,
  onUpdate,
  updating = false,
  error = null,
  successMsg = null,
  onClearError,
  onClearSuccess,
}) {
  const [newPriceInput, setNewPriceInput] = useState('');
  const [clientError, setClientError] = useState(null);

  useEffect(() => {
    if (successMsg) {
      setNewPriceInput('');
      setClientError(null);
    }
  }, [successMsg]);

  const parsedNewPrice = parseFloat(newPriceInput);
  const isValidNumber = !isNaN(parsedNewPrice) && newPriceInput.trim() !== '';

  const getDiffDisplay = () => {
    if (!isValidNumber) return null;
    const diff = parsedNewPrice - Number(currentPrice);
    if (diff === 0) {
      return <span className={styles.diffUnchanged}>Giá không đổi</span>;
    }

    const pct = Number(currentPrice) > 0 ? ((diff / Number(currentPrice)) * 100).toFixed(1) : null;
    const sign = diff > 0 ? '+' : '';
    const formattedDiff = `${sign}${diff.toLocaleString('vi-VN')} ₫`;
    const formattedPct = pct !== null ? ` (${sign}${pct}%)` : '';

    if (diff > 0) {
      return (
        <span className={styles.diffPositive}>
          {formattedDiff}
          {formattedPct}
        </span>
      );
    }
    return (
      <span className={styles.diffNegative}>
        {formattedDiff}
        {formattedPct}
      </span>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onClearError) onClearError();
    if (onClearSuccess) onClearSuccess();
    setClientError(null);

    if (!isValidNumber) {
      setClientError('Vui lòng nhập giá bán hợp lệ');
      return;
    }
    if (parsedNewPrice < 0) {
      setClientError('Giá bán phải là số >= 0');
      return;
    }
    if (parsedNewPrice === Number(currentPrice)) {
      setClientError('Giá mới phải khác giá hiện tại');
      return;
    }

    try {
      await onUpdate(parsedNewPrice);
    } catch {
      // error handled by hook
    }
  };

  const handleInputChange = (e) => {
    setNewPriceInput(e.target.value);
    if (clientError) setClientError(null);
    if (onClearError) onClearError();
    if (onClearSuccess) onClearSuccess();
  };

  const activeError = clientError || error;

  return (
    <div className={styles.updateForm}>
      <h3 className={styles.updateFormTitle}>Cập nhật giá bán</h3>
      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.updateInputRow}>
          <input
            type="number"
            min="0"
            step="any"
            className={styles.inputPrice}
            placeholder="Nhập giá mới..."
            value={newPriceInput}
            onChange={handleInputChange}
            disabled={updating}
            aria-label="Giá bán mới"
          />
          <Button variant="primary" type="submit" loading={updating}>
            Cập nhật giá
          </Button>
        </div>

        <div className={styles.diffContainer}>{getDiffDisplay()}</div>

        {activeError && (
          <div className={styles.alertError} role="alert">
            {activeError}
          </div>
        )}

        {successMsg && (
          <div className={styles.alertSuccess} role="status">
            {successMsg}
          </div>
        )}
      </form>
    </div>
  );
}

