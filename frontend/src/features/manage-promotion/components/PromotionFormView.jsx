'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/shared/components/Button';
import FormField from '@/shared/components/FormField';
import PageHeader from '@/shared/components/PageHeader';
import ErrorMessage from '@/shared/components/ErrorMessage';
import Spinner from '@/shared/components/Spinner';
import PromotionDialog from './PromotionDialog';
import * as api from '../services/promotion.service';
import styles from './promotion.module.css';
import { promotionText } from '../promotionText';

const blank = { name: '', type: 'Percent', value: '', startDate: '', endDate: '', minInvoiceValue: '0', maxBudget: '' };
const localDate = (value) => value ? new Date(new Date(value).getTime() + 7 * 3600000).toISOString().slice(0,16) : '';
function validate(form, draft) {
  const errors = {};
  if (!draft && !form.name.trim()) errors.name = 'Name is required';
  if (form.name.length > 255) errors.name = 'Maximum 255 characters';
  if ((!draft && form.value === '') || (form.value !== '' && (!Number.isFinite(Number(form.value)) || Number(form.value) < 0 || (form.type === 'Percent' && Number(form.value) > 100)))) errors.value = 'Invalid discount value';
  for (const key of ['startDate','endDate']) if (!draft && !form[key]) errors[key] = 'Invalid time';
  if (form.startDate && new Date(`${form.startDate}+07:00`) < new Date()) errors.startDate = 'Invalid time';
  if (form.startDate && form.endDate && form.endDate < form.startDate) errors.endDate = 'Invalid time';
  for (const key of ['minInvoiceValue','maxBudget']) if (form[key] !== '' && (!Number.isFinite(Number(form[key])) || Number(form[key]) < 0 || (key === 'maxBudget' && Number(form[key]) === 0))) errors[key] = 'Invalid amount';
  for (const key of ['value','minInvoiceValue','maxBudget']) {
    const amount = Number(form[key]);
    if (form[key] !== '' && (amount > 9999999999999.99 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.001)) errors[key] = key === 'value' ? 'Invalid discount value' : 'Invalid amount (maximum 2 decimals)';
  }
  return errors;
}
export default function PromotionFormView() {
  const router = useRouter(), params = useSearchParams(), draftId = params.get('draft');
  const [form, setForm] = useState(blank), [baseline, setBaseline] = useState(JSON.stringify(blank));
  const [errors, setErrors] = useState({}), [error, setError] = useState('');
  const [loading, setLoading] = useState(!!draftId), [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false), [leaving, setLeaving] = useState(null);
  const dirty = JSON.stringify(form) !== baseline;
  const guard = useRef(false), saving = useRef(false), allowLeave = useRef(false);
  guard.current = dirty;
  async function load() {
    if (!draftId) return;
    setLoading(true); setError(''); setLoadFailed(false);
    try {
      const { promotion: p } = await api.getPromotion(draftId);
      if (p.status !== 'Draft') throw new Error('Only drafts can be resumed here');
      const next = { name: p.name || '', type: p.type || 'Percent', value: p.value ?? '', minInvoiceValue: p.minInvoiceValue ?? '0', maxBudget: p.maxBudget ?? '', startDate: localDate(p.startDate), endDate: localDate(p.endDate) };
      setForm(next); setBaseline(JSON.stringify(next));
    } catch (err) { setError(err.message); setLoadFailed(true); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [draftId]);
  useEffect(() => {
    // A same-URL history entry lets Back be cancelled while keeping the mounted form intact.
    if (!window.history.state?.promotionFormGuard) {
      window.history.pushState({ ...window.history.state, promotionFormGuard: true }, '', window.location.href);
    }
    const unload = (event) => { if ((guard.current || saving.current) && !allowLeave.current) { event.preventDefault(); event.returnValue = ''; } };
    const click = (event) => {
      const link = event.target.closest('a[href]');
      if (!link || link.target === '_blank' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !(guard.current || saving.current) || allowLeave.current) return;
      const href = link.href;
      if (href === window.location.href) return;
      event.preventDefault(); event.stopPropagation();
      if (!saving.current) setLeaving(() => () => {
        const destination = new URL(href);
        if (destination.origin === window.location.origin) router.push(destination.pathname + destination.search + destination.hash);
        else window.location.assign(href);
      });
    };
    const back = () => {
      if (allowLeave.current) return;
      if (saving.current) { window.history.forward(); return; }
      if (!guard.current || window.confirm('Bạn có muốn bỏ các thay đổi chưa lưu không?')) { allowLeave.current = true; window.history.back(); }
      else window.history.forward();
    };
    window.addEventListener('beforeunload', unload);
    document.addEventListener('click', click, true);
    window.addEventListener('popstate', back);
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', click, true); window.removeEventListener('popstate', back); };
  }, []);
  function cancel() {
    if (dirty) setLeaving(() => () => router.push('/promotions'));
    else router.push('/promotions');
  }
  async function save(draft) {
    if (saving.current) return;
    const body = { ...form, mode: draft ? 'draft' : 'publish', startDate: form.startDate ? `${form.startDate}+07:00` : null, endDate: form.endDate ? `${form.endDate}+07:00` : null };
    const issues = validate(form, draft); setErrors(issues); setError('');
    if (Object.keys(issues).length) return;
    saving.current = true; setBusy(true);
    try {
      const promotion = draftId ? await api.updateDraft(draftId, body) : await api.createPromotion(body);
      allowLeave.current = true; guard.current = false; setBaseline(JSON.stringify(form));
      if (draft) router.push(`/promotions?savedDraft=${promotion.id}`);
      else router.push(`/promotions/${promotion.id}/assign?created=1`);
    } catch (err) {
      setError(err.message || 'Không thể lưu. Vui lòng thử lại.'); setErrors(err.details || {});
    }
    finally { saving.current = false; setBusy(false); }
  }
  function input(key, label, type = 'text') {
    return <FormField key={key} htmlFor={key} label={label} error={promotionText(errors[key])}><input id={key} className="input" type={type} value={form[key]} disabled={busy}
      step={type === 'number' ? '0.01' : undefined} min={type === 'number' ? '0' : undefined} maxLength={key === 'name' ? 255 : undefined}
      aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : undefined}
      onChange={(e) => { setForm((old) => ({ ...old, [key]: e.target.value })); setErrors((old) => ({ ...old, [key]: undefined })); }} /></FormField>;
  }
  return <div className={styles.stack}>
    <PageHeader title={draftId ? 'Tiếp tục bản nháp khuyến mãi' : 'Tạo khuyến mãi'} subtitle="Nhập thông tin ưu đãi, sau đó chọn sản phẩm hoặc danh mục áp dụng." />
    <div className={styles.band}><h2>Bắt đầu chương trình khuyến mãi của bạn.</h2><p>Lưu bản nháp để tiếp tục sau, hoặc phát hành và chuyển sang gán sản phẩm.</p></div>
    {loading ? <Spinner center /> : loadFailed ? <ErrorMessage message={promotionText(error)} onRetry={load} /> : <form className={styles.card} noValidate onSubmit={(event) => { event.preventDefault(); save(false); }}>
      <div className={styles.steps}>01 · Thông tin khuyến mãi → 02 · Gán sản phẩm</div>
      <ErrorMessage message={promotionText(error)} inline />
      {input('name', 'Tên khuyến mãi')}
      <div className={styles.grid}>
        {input('startDate', 'Thời gian bắt đầu · GMT+7', 'datetime-local')}{input('endDate', 'Thời gian kết thúc · GMT+7', 'datetime-local')}
        <FormField htmlFor="type" label="Loại giảm giá" error={promotionText(errors.type)}><select id="type" className="input" value={form.type} disabled={busy} onChange={(e) => setForm((old) => ({ ...old, type: e.target.value }))}><option value="Percent">Phần trăm</option><option value="Amount">Số tiền</option></select></FormField>
        {input('value', form.type === 'Percent' ? 'Giá trị giảm giá (%)' : 'Giá trị giảm giá (₫)', 'number')}
        {input('minInvoiceValue', 'Giá trị hóa đơn tối thiểu (₫)', 'number')}{input('maxBudget', 'Ngân sách tối đa (₫) · Không bắt buộc', 'number')}
      </div>
      <p className={styles.muted}>Thời gian sử dụng múi giờ GMT+7. Bản nháp có thể chưa đủ thông tin và không được áp dụng khi thanh toán.</p>
      <div className={styles.actions}><Button type="submit" loading={busy}>Lưu</Button><Button variant="secondary" disabled={busy} onClick={() => save(true)}>Lưu bản nháp</Button><Button variant="ghost" disabled={busy} onClick={cancel}>Hủy</Button></div>
    </form>}
    {leaving && <PromotionDialog title="Bạn có muốn bỏ các thay đổi chưa lưu không?" onCancel={() => setLeaving(null)}><p>Các thay đổi chưa lưu sẽ bị mất.</p><div className={styles.actions}><Button variant="secondary" onClick={() => setLeaving(null)}>Ở lại</Button><Button variant="danger" onClick={() => { allowLeave.current = true; leaving(); }}>Bỏ thay đổi</Button></div></PromotionDialog>}
  </div>;
}
