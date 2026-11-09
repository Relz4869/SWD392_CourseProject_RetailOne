'use client';

import React from 'react';
import EmptyState from '@/shared/components/EmptyState';
import styles from './sale-price.module.css';

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const mins = pad(d.getMinutes());
  return `${hours}:${mins} ${day}/${month}/${year}`;
}

function formatCurrency(val) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return Number(val).toLocaleString('vi-VN') + ' ₫';
}

export default function PriceHistoryTable({ history = [] }) {
  if (!history || history.length === 0) {
    return (
      <div className={styles.tableWrap}>
        <EmptyState message="Chưa có thay đổi giá nào" />
      </div>
    );
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th style={{ width: '25%' }}>Thời điểm</th>
            <th style={{ width: '25%' }} className={styles.alignRight}>
              Giá cũ
            </th>
            <th style={{ width: '25%' }} className={styles.alignRight}>
              Giá mới
            </th>
            <th style={{ width: '25%' }}>Người thay đổi</th>
          </tr>
        </thead>
        <tbody>
          {history.map((row, idx) => (
            <tr key={idx}>
              <td className={styles.timeCell}>{formatDateTime(row.changedAt)}</td>
              <td className={styles.alignRight}>{formatCurrency(row.oldSalePrice)}</td>
              <td className={`${styles.alignRight} ${styles.boldPrice}`}>
                {formatCurrency(row.newSalePrice)}
              </td>
              <td>{row.changedByName || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

