'use client';

import { useMemo, useState } from 'react';
import Button from '@/shared/components/Button';
import DenominationRow from './DenominationRow';
import styles from './cashHandover.module.css';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

export default function CashCountForm({ denominations, submitting, onSubmit }) {
  const [counts, setCounts] = useState(() => Object.fromEntries(denominations.map((value) => [String(value), 0])));
  const [confirmed, setConfirmed] = useState(false);
  const total = useMemo(
    () => denominations.reduce((sum, value) => sum + value * counts[String(value)], 0),
    [counts, denominations],
  );

  const update = (denomination, quantity) => {
    if (!Number.isSafeInteger(quantity) || quantity < 0) return;
    setCounts((current) => ({ ...current, [String(denomination)]: quantity }));
    setConfirmed(false);
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!confirmed) { setConfirmed(true); return; }
        onSubmit(counts);
      }}
      className={styles.countCard}
    >
      <div className={styles.sectionHeading}>
        <div>
          <span className={styles.step}>Bước 1 · Kiểm đếm</span>
          <h2>Kiểm đếm tiền mặt</h2>
        </div>
        <p>Hãy đếm toàn bộ tiền mặt thực tế trong quầy trước khi xác nhận.</p>
      </div>

      <div className={styles.denominationHeader} aria-hidden="true">
        <span>Mệnh giá</span><span>Số tờ</span><span>Thành tiền</span>
      </div>
      {denominations.map((denomination) => (
        <DenominationRow key={denomination} denomination={denomination} quantity={counts[String(denomination)]} onChange={update} disabled={submitting} />
      ))}

      <div className={styles.totalRow}>
        <span>Tổng tiền vừa đếm</span>
        <strong>{money.format(total)}</strong>
      </div>

      {confirmed && (
        <div className={styles.warning} role="alert">
          Kết quả sẽ được niêm phong sau khi lưu và không thể tự sửa. Kiểm tra lại số lượng rồi xác nhận.
        </div>
      )}
      <Button type="submit" loading={submitting} block>
        {confirmed ? 'Xác nhận và lưu kiểm đếm' : 'Kiểm tra trước khi lưu'}
      </Button>
    </form>
  );
}
