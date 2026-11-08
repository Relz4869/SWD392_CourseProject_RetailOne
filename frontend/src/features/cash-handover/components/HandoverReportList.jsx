import DataTable from '@/shared/components/DataTable';
import EmptyState from '@/shared/components/EmptyState';
import Pagination from '@/shared/components/Pagination';
import styles from './handoverReport.module.css';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

function variance(row) {
  const amount = Number(row.variance || 0);
  if (amount === 0) return <span className={styles.balanced}>Khớp quỹ</span>;
  return (
    <span className={styles.discrepancy}>
      Chênh lệch {amount > 0 ? '+' : ''}{money.format(amount)}
    </span>
  );
}

export default function HandoverReportList({ data, loading, onOpen, onPageChange, onPageSizeChange }) {
  const columns = [
    { key: 'handoverTime', title: 'Thời điểm', render: (row) => dateTime.format(new Date(row.handoverTime)) },
    { key: 'staffName', title: 'Nhân viên' },
    { key: 'shiftName', title: 'Ca' },
    { key: 'expectedCash', title: 'Tiền kỳ vọng', align: 'right', render: (row) => money.format(Number(row.expectedCash)) },
    { key: 'actualCash', title: 'Tiền thực tế', align: 'right', render: (row) => money.format(Number(row.actualCash)) },
    { key: 'variance', title: 'Đối soát', render: variance },
    { key: 'reviewStatus', title: 'Trạng thái duyệt', render: (row) => row.reviewStatus === 'Reviewed' ? 'Đã duyệt' : 'Chờ duyệt' },
    { key: 'action', title: '', render: (row) => <button className={styles.textButton} type="button" onClick={() => onOpen(row.id)}>Chi tiết</button> },
  ];

  return (
    <section className={styles.listCard}>
      <DataTable
        columns={columns}
        rows={data.items}
        loading={loading}
        emptyContent={<EmptyState message="Không có bàn giao đã hoàn tất trong khoảng lọc." />}
      />
      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        totalItems={data.totalItems}
        totalPages={data.totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </section>
  );
}
