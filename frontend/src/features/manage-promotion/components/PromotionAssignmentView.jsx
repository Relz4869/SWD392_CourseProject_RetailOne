'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Button from '@/shared/components/Button';
import PageHeader from '@/shared/components/PageHeader';
import ErrorMessage from '@/shared/components/ErrorMessage';
import Spinner from '@/shared/components/Spinner';
import PromotionDialog from './PromotionDialog';
import { displayDate } from './PromotionListView';
import * as api from '../services/promotion.service';
import styles from './promotion.module.css';
import { promotionStatus, productStatus, promotionText } from '../promotionText';

export default function PromotionAssignmentView({ promotionId }) {
  const params = useSearchParams();
  const [view, setView] = useState(null), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [tab, setTab] = useState('products'), [search, setSearch] = useState(''), [category, setCategory] = useState('');
  const [productIds, setProducts] = useState([]), [categoryIds, setCategories] = useState([]);
  const [busy, setBusy] = useState(false), [conflicts, setConflicts] = useState(null), [outcomes, setOutcomes] = useState([]);
  const lock = useRef(false);
  async function load() {
    setError('');
    try { setView(await api.getPromotion(promotionId)); } catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, [promotionId]);
  async function save(resolution) {
    if (lock.current) return;
    setError(''); setNotice('');
    if (!productIds.length && !categoryIds.length) { setError('Please select at least 1 product'); return; }
    lock.current = true; setBusy(true);
    try {
      const result = await api.assignTargets(promotionId, { productIds, categoryIds, resolution, conflictKeys: conflicts?.map((c) => c.key) });
      setView(result); setOutcomes(result.outcomes); setProducts([]); setCategories([]); setConflicts(null); setNotice('Đã lưu danh sách gán.');
    } catch (err) {
      if (err.code === 'PROMOTION_OVERLAP') setConflicts(err.details.conflicts);
      else setError(err.message);
    } finally { lock.current = false; setBusy(false); }
  }
  async function remove(target) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try { setView(await api.removeTarget(promotionId, target.id)); setNotice('Đã bỏ gán thành công.'); }
    catch (err) { setError(err.message); }
    finally { lock.current = false; setBusy(false); }
  }
  const toggle = (setter, value) => setter((values) => values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  const editable = view && !['Draft','Expired','Deleted'].includes(view.promotion.status);
  const items = (tab === 'products' ? view?.products || [] : view?.categories || []).filter((p) => `${p.name} ${p.id} ${p.code || ''}`.toLowerCase().includes(search.toLowerCase()) && (tab !== 'products' || !category || p.categoryId === Number(category)));
  return <div className={styles.stack}>
    <PageHeader title="Gán sản phẩm cho khuyến mãi" subtitle={view ? `${view.promotion.name} · #${view.promotion.id}` : 'Đang tải khuyến mãi…'} actions={<Link href="/promotions">Về danh sách khuyến mãi</Link>} />
    {view && params.get('created') === '1' && <div className={styles.notice} role="status">Đã tạo khuyến mãi thành công. Mã: {promotionId}</div>}
    {notice && <div className={styles.notice} role="status">{notice}</div>}
    <ErrorMessage message={promotionText(error)} onRetry={load} />
    {!view ? !error && <Spinner center /> : <>
      <div className={styles.band}><h2>{view.promotion.name || 'Bản nháp chưa đặt tên'}</h2><p>{promotionStatus[view.promotion.status] || view.promotion.status} · {displayDate(view.promotion.startDate)} — {displayDate(view.promotion.endDate)} · GMT+7</p></div>
      {!editable && <div className={styles.notice}>Không thể gán thêm sản phẩm cho khuyến mãi này.{view.promotion.status === 'Draft' && <> <Link href={`/promotions/create?draft=${promotionId}`}>Tiếp tục chỉnh sửa và phát hành bản nháp</Link></>}</div>}
      <div className={styles.columns}>
        <section className={styles.card}><h2>Chọn sản phẩm hoặc danh mục</h2>
          <div className={styles.toolbar} role="tablist" aria-label="Cách chọn sản phẩm">
            <Button role="tab" aria-selected={tab === 'products'} variant={tab === 'products' ? 'primary' : 'secondary'} disabled={busy} onClick={() => setTab('products')}>Chọn sản phẩm</Button>
            <Button role="tab" aria-selected={tab === 'categories'} variant={tab === 'categories' ? 'primary' : 'secondary'} disabled={busy} onClick={() => setTab('categories')}>Chọn theo danh mục</Button>
          </div>
          <div className={styles.toolbar}><input className="input" aria-label="Tìm sản phẩm hoặc danh mục" placeholder="Tìm theo tên hoặc mã" value={search} onChange={(e) => setSearch(e.target.value)} />
            {tab === 'products' && <select className="input" aria-label="Lọc danh mục" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">Tất cả danh mục</option>{view.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}
          </div>
          {tab === 'categories' && <p className={styles.muted}>Áp dụng cho sản phẩm đang bán hiện tại và được thêm vào danh mục sau này. Danh mục con cần được chọn riêng.</p>}
          <div className={styles.list}>{items.map((p) => {
            const active = tab === 'categories' || p.status === 'Selling';
            const selected = tab === 'products' ? productIds : categoryIds;
            return <div className={styles.row} key={p.id}><label className={styles.choice}>
              <input type="checkbox" checked={selected.includes(p.id)} disabled={!active || busy || !editable} onChange={() => toggle(tab === 'products' ? setProducts : setCategories, p.id)} />
              <span><strong>{p.name}</strong><br /><span className={styles.muted}>#{p.id} {p.code || ''} · {tab === 'categories' ? 'Đang hoạt động' : productStatus[p.status] || p.status}</span></span>
            </label></div>;
          })}{!items.length && <p>Không tìm thấy kết quả phù hợp.</p>}</div>
          <p className={styles.muted}>Đã chọn {productIds.length} sản phẩm · {categoryIds.length} danh mục</p>
          <Button loading={busy} disabled={!editable} onClick={() => save()}>Lưu</Button>
        </section>
        <section className={styles.card}><h2>Danh sách đã gán</h2>
          <p className={styles.muted}>Bỏ gán có hiệu lực ngay lập tức. Sản phẩm được áp dụng theo danh mục vẫn được hưởng khuyến mãi cho đến khi bỏ gán danh mục tương ứng.</p>
          {view.targets.map((t) => <div key={t.id} className={styles.row}><span>{t.categoryId ? 'Danh mục: ' : 'Sản phẩm: '}{(t.categoryId ? view.categories.find((c) => c.id === t.categoryId) : view.products.find((p) => p.id === t.productId))?.name || `#${t.categoryId || t.productId}`}{t.variantId ? ` · Đơn vị bán #${t.variantId}` : ''}</span><Button variant="ghost" disabled={busy} onClick={() => remove(t)}>Bỏ gán</Button></div>)}
          {!view.targets.length && <p>Chưa có sản phẩm hoặc danh mục được gán.</p>}
          <h3>Sản phẩm được áp dụng</h3><div className={styles.list}>{view.assignedProducts.map((p) => <div className={styles.row} key={p.id}><span>{p.name}<br /><span className={styles.muted}>#{p.id} · {p.direct ? 'Gán trực tiếp' : ''}{p.direct && p.derived ? ' + ' : ''}{p.derived ? 'Theo danh mục' : ''}</span></span></div>)}</div>
          {outcomes.length > 0 && <div role="status"><h3>Kết quả lưu</h3>{outcomes.map((o) => <p key={o.target}>{o.targetType === 'Product' ? 'Sản phẩm' : 'Danh mục'}: {o.targetName} · {promotionText(o.result)}</p>)}</div>}
        </section>
      </div>
    </>}
    {conflicts && <PromotionDialog title="Khuyến mãi trùng thời gian" busy={busy} onCancel={() => setConflicts(null)}>
      {conflicts.map((c) => <p key={c.key}>Sản phẩm {c.productId ? c.productName : `thuộc danh mục ${view?.categories.find((category) => category.id === c.categoryId)?.name || c.categoryId}`} đang thuộc khuyến mãi {c.promotionName}. Bạn muốn ghi đè hay giữ khuyến mãi cũ?</p>)}
      <p className={styles.muted}>Giữ khuyến mãi cũ sẽ bỏ qua các lựa chọn bị trùng. Ghi đè danh mục sẽ chuyển liên kết danh mục, bao gồm cả sản phẩm thêm sau này. Ghi đè sản phẩm sẽ loại sản phẩm đó khỏi khuyến mãi theo danh mục trước đó.</p>
      <ErrorMessage message={promotionText(error)} inline /><div className={styles.actions}><Button variant="secondary" disabled={busy} onClick={() => setConflicts(null)}>Hủy</Button><Button variant="secondary" disabled={busy} onClick={() => save('keep')}>Giữ khuyến mãi cũ</Button><Button loading={busy} onClick={() => save('overwrite')}>Ghi đè</Button></div>
    </PromotionDialog>}
  </div>;
}
