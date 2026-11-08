'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import Button from '@/shared/components/Button';
import PageHeader from '@/shared/components/PageHeader';
import DataTable from '@/shared/components/DataTable';
import ErrorMessage from '@/shared/components/ErrorMessage';
import PromotionDialog from './PromotionDialog';
import * as api from '../services/promotion.service';
import styles from './promotion.module.css';
import { promotionStatus, promotionText } from '../promotionText';

export const displayDate = (value) => value ? new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
export default function PromotionListView() {
  const router = useRouter();
  const params = useSearchParams();
  const { hasPermission } = useAuth();
  const [rows, setRows] = useState([]), [loading, setLoading] = useState(true);
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [selected, setSelected] = useState(null), [busy, setBusy] = useState(false);
  const [search, setSearch] = useState(''), [status, setStatus] = useState('');
  const lock = useRef(false);
  async function load() {
    setLoading(true); setError('');
    try { setRows(await api.loadPromotions()); } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); const timer = setInterval(load, 60000); return () => clearInterval(timer); }, []);
  async function agree() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const result = await api.deletePromotion(selected.id);
      setRows((current) => current.filter((p) => p.id !== selected.id));
      setNotice(`Đã xóa khuyến mãi. ${promotionText(result.reason)}.`); setSelected(null);
      await load();
    } catch (err) { setError(err.message); }
    finally { lock.current = false; setBusy(false); }
  }
  const visible = rows.filter((p) => (!status || p.status === status) && `${p.name || ''} ${p.id}`.toLowerCase().includes(search.toLowerCase()));
  const successMessage = notice || (rows.some((p) => p.status === 'Draft' && String(p.id) === params.get('savedDraft')) ? 'Đã lưu bản nháp thành công.' : '');
  return <div className={styles.stack}>
    <PageHeader title="Khuyến mãi" subtitle="Tạo ưu đãi, chọn sản phẩm và quản lý các chương trình khuyến mãi."
      actions={hasPermission('PROMOTION_CREATE') && <Button onClick={() => router.push('/promotions/create')}>+ Tạo khuyến mãi</Button>} />
    <div className={styles.band}><h2>Ưu đãi phù hợp cho mỗi lần mua sắm.</h2><p>Lên lịch khuyến mãi, lựa chọn sản phẩm và bảo toàn lịch sử bán hàng.</p></div>
    {successMessage && <div role="status" className={styles.notice}>{successMessage}</div>}
    <ErrorMessage message={promotionText(error)} onRetry={load} />
    <div><div className={styles.toolbar}>
      <input className="input" aria-label="Tìm khuyến mãi" placeholder="Tìm theo tên hoặc mã" value={search} onChange={(e) => setSearch(e.target.value)} />
      <select className="input" aria-label="Lọc trạng thái" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Tất cả trạng thái</option>{['Draft','Upcoming','Active','Disabled','Expired'].map((s) => <option key={s} value={s}>{promotionStatus[s]}</option>)}</select>
    </div><DataTable loading={loading} rows={visible} emptyContent="Không tìm thấy khuyến mãi." columns={[
      { key: 'name', title: 'Khuyến mãi', render: (p) => <div><strong>{p.name || 'Bản nháp chưa đặt tên'}</strong><div className={styles.muted}>#{p.id}</div></div> },
      { key: 'value', title: 'Giảm giá', render: (p) => p.value == null ? '—' : `${p.value.toLocaleString('vi-VN')}${p.type === 'Percent' ? '%' : ' ₫'}` },
      { key: 'startDate', title: 'Bắt đầu · GMT+7', render: (p) => displayDate(p.startDate) },
      { key: 'endDate', title: 'Kết thúc · GMT+7', render: (p) => displayDate(p.endDate) },
      { key: 'status', title: 'Trạng thái', render: (p) => <span className={`${styles.badge} ${p.status === 'Active' ? styles.active : ''}`}>{promotionStatus[p.status] || p.status}</span> },
      { key: 'actions', title: 'Thao tác', render: (p) => <div className={styles.actions}>
        {p.status === 'Draft' && hasPermission('PROMOTION_CREATE') ? <Button variant="ghost" onClick={() => router.push(`/promotions/create?draft=${p.id}`)}>Tiếp tục bản nháp</Button> : hasPermission('PROMOTION_ASSIGN_PRODUCT') && <Button variant="ghost" onClick={() => router.push(`/promotions/${p.id}/assign`)}>Gán sản phẩm</Button>}
        {hasPermission('PROMOTION_DELETE') && <Button variant="ghost" aria-label={`Xóa ${p.name || 'bản nháp'}`} onClick={() => { setError(''); setSelected(p); }}><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" /></svg>Xóa</Button>}
      </div> },
    ]} /></div>
    {selected && <PromotionDialog title="Bạn có chắc chắn muốn xóa khuyến mãi này không?" busy={busy} onCancel={() => setSelected(null)}>
      <p>{selected.name || 'Bản nháp chưa đặt tên'} · #{selected.id}</p><p>Lịch sử hóa đơn sẽ được giữ nguyên. Không thể xóa khuyến mãi đang diễn ra.</p>
      <ErrorMessage message={promotionText(error)} inline /><div className={styles.actions}><Button variant="secondary" disabled={busy} onClick={() => setSelected(null)}>Hủy</Button><Button variant="danger" loading={busy} onClick={agree}>Đồng ý</Button></div>
    </PromotionDialog>}
  </div>;
}
