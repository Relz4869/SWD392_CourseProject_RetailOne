import { formatCurrency, formatNumber } from '@/shared/utils/format';
import { ROLES } from '@/shared/constants/roles';
import styles from '../components/manage-product.module.css';

const ALL_ROLES = [ROLES.MANAGER, ROLES.CASHIER, ROLES.WAREHOUSE, 'Warehouse'];

export const ALL_COLUMNS = [
  {
    key: 'imageUrl',
    title: 'Ảnh',
    sortable: false,
    roles: [ROLES.MANAGER],
    render: (row) =>
      row.imageUrl ? (
        <img src={row.imageUrl} alt={row.name} className={styles.productThumb} />
      ) : (
        <div className={styles.productThumbPlaceholder}>Ảnh</div>
      ),
  },
  {
    key: 'code',
    title: 'Mã SP',
    sortable: true,
    roles: ALL_ROLES,
  },
  {
    key: 'name',
    title: 'Tên sản phẩm',
    sortable: true,
    roles: ALL_ROLES,
  },
  {
    key: 'category',
    title: 'Danh mục',
    sortable: false,
    roles: ALL_ROLES,
    render: (row) => (row.category && row.category.name ? row.category.name : '—'),
  },
  {
    key: 'baseUnit',
    title: 'ĐVT',
    sortable: false,
    roles: ALL_ROLES,
  },
  {
    key: 'salePrice',
    title: 'Giá bán',
    sortable: true,
    align: 'right',
    roles: [ROLES.MANAGER, ROLES.CASHIER],
    render: (row) => <span className={styles.tabular}>{formatCurrency(row.salePrice)}</span>,
  },
  {
    key: 'barcode',
    title: 'Mã vạch',
    sortable: false,
    roles: ALL_ROLES,
    render: (row) => <span className={styles.mono}>{row.barcode || '—'}</span>,
  },
  {
    key: 'stockInBaseUnit',
    title: 'Tồn kho',
    sortable: true,
    align: 'right',
    roles: ALL_ROLES,
    render: (row) =>
      row.outOfStock ? (
        <span className={styles.outOfStock}>Hết hàng</span>
      ) : (
        <span className={styles.tabular}>{formatNumber(row.stockInBaseUnit)}</span>
      ),
  },
  {
    key: 'variantCount',
    title: 'Số ĐVT',
    sortable: false,
    align: 'right',
    roles: [ROLES.MANAGER],
    render: (row) => <span className={styles.tabular}>{row.variantCount ?? '—'}</span>,
  },
  {
    key: 'status',
    title: 'Trạng thái',
    sortable: false,
    roles: [ROLES.MANAGER, ROLES.WAREHOUSE, 'Warehouse'],
    render: (row) => {
      if (row.status === 'Selling') {
        return <span className={`${styles.badge} ${styles.badgeSelling}`}>Đang bán</span>;
      }
      if (row.status === 'StopSelling') {
        return <span className={`${styles.badge} ${styles.badgeStopSelling}`}>Ngừng bán</span>;
      }
      if (row.status === 'Suspended') {
        return <span className={`${styles.badge} ${styles.badgeSuspended}`}>Tạm ngưng</span>;
      }
      return row.status || '—';
    },
  },
];

export function getVisibleColumns(role) {
  const normRole = role === 'Warehouse' ? ROLES.WAREHOUSE : role;
  return ALL_COLUMNS.filter((col) => col.roles.includes(normRole) || col.roles.includes(role));
}
