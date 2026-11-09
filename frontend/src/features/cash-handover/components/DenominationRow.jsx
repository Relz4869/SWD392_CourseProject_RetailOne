import styles from './cashHandover.module.css';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

export default function DenominationRow({ denomination, quantity, onChange, disabled }) {
  const inputId = `denomination-${denomination}`;
  const update = (next) => onChange(denomination, Math.max(0, next));
  return (
    <div className={styles.denominationRow}>
      <label htmlFor={inputId} className={styles.denominationLabel}>{money.format(denomination)}</label>
      <div className={styles.stepper}>
        <button type="button" onClick={() => update(quantity - 1)} disabled={disabled || quantity === 0} aria-label={`Giảm số tờ ${money.format(denomination)}`}>−</button>
        <input
          id={inputId}
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={quantity}
          disabled={disabled}
          onChange={(event) => {
            const raw = event.target.value;
            update(raw === '' ? 0 : Number(raw));
          }}
        />
        <button type="button" onClick={() => update(quantity + 1)} disabled={disabled} aria-label={`Tăng số tờ ${money.format(denomination)}`}>+</button>
      </div>
      <output className={styles.subtotal}>{money.format(denomination * quantity)}</output>
    </div>
  );
}
