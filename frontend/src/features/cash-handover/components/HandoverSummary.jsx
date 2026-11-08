import styles from './handoverReport.module.css';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

export default function HandoverSummary({ summary }) {
  const cards = [
    ['Số lần bàn giao', summary.totalHandovers],
    ['Tổng chênh lệch có dấu', money.format(Number(summary.signedTotalVariance || 0))],
    ['Chênh lệch trung bình có dấu', money.format(Number(summary.averageSignedVariance || 0))],
    ['Chênh lệch chờ duyệt', summary.unreviewedDiscrepancies],
  ];

  return (
    <section className={styles.summaryGrid} aria-label="Tổng quan bàn giao tiền">
      {cards.map(([label, value]) => (
        <article key={label} className={styles.summaryCard}>
          <span>{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </section>
  );
}
