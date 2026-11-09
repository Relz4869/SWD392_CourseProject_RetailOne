'use client';
import { useEffect,useRef,useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { ROLE_LABELS } from '@/shared/constants/roles';
import PageHeader from '@/shared/components/PageHeader';
import Button from '@/shared/components/Button';
import DataTable from '@/shared/components/DataTable';
import Pagination from '@/shared/components/Pagination';
import ErrorMessage from '@/shared/components/ErrorMessage';
import * as api from '../services/staff.service';
import StaffDialog from './StaffDialog';
import styles from './staff.module.css';

export default function StaffListView() {
  const router=useRouter();const {user,hasPermission}=useAuth();
  const [rows,setRows]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [search,setSearch]=useState(''),[status,setStatus]=useState(''),[selected,setSelected]=useState(null),[busy,setBusy]=useState(false);
  const [page,setPage]=useState(1),[pageSize,setPageSize]=useState(10);
  const lock=useRef(false);
  async function load() {setLoading(true);setError('');try{setRows(await api.listStaff());}catch(e){setError(e.message || 'Không tải được danh sách nhân viên');}finally{setLoading(false);}}
  useEffect(()=>{load();},[]);
  async function change() {
    if(lock.current)return;lock.current=true;setBusy(true);setError('');
    try {
      const next=selected.account.isActive==='active'?'locked':'active';
      const updated=await api.changeAccountStatus(selected.id,next);
      setRows(current=>current.map(row=>row.id===updated.id?updated:row));
      setNotice(next==='locked'?'Đã khóa tài khoản và thu hồi các phiên đăng nhập.':'Đã mở khóa tài khoản. Nhân viên cần đăng nhập lại.');
      setSelected(null);
    }catch(e){setError(e.code==='SELF_LOCK_DENIED'?'Thao tác bị từ chối. Bạn không thể khóa tài khoản của chính mình.':e.message || 'Không thể cập nhật trạng thái');}
    finally{lock.current=false;setBusy(false);}
  }
  const visible=rows.filter(row=>`${row.fullName} ${row.phoneNumber} ${row.account?.username || ''} ${row.id}`.toLowerCase().includes(search.toLowerCase())&&(!status||row.account?.isActive===status));
  const totalPages=Math.max(1,Math.ceil(visible.length/pageSize));
  const currentPage=Math.min(page,totalPages);
  const pagedRows=visible.slice((currentPage-1)*pageSize,currentPage*pageSize);
  return <div className={styles.stack}>
    <PageHeader title="Nhân viên" subtitle="Quản lý hồ sơ và quyền truy cập tài khoản nhân viên."
      actions={hasPermission('STAFF_CREATE')&&<Button onClick={()=>router.push('/staff/create')}>+ Thêm nhân viên</Button>}/>
    {notice&&<div className={styles.notice} role="status">{notice}</div>}
    {!selected&&<ErrorMessage message={error} onRetry={load}/>}
    <div><div className={styles.toolbar}><input className="input" aria-label="Tìm nhân viên" placeholder="Tìm theo tên, số điện thoại, tài khoản hoặc mã" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
      <select className="input" aria-label="Lọc trạng thái tài khoản" value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option value="">Tất cả trạng thái</option><option value="active">Đang hoạt động</option><option value="locked">Đã khóa</option></select>
    </div><DataTable loading={loading} rows={pagedRows} emptyContent="Không tìm thấy nhân viên." columns={[
      {key:'fullName',title:'Nhân viên',render:row=><div><strong>{row.fullName}</strong><div className={styles.muted}>Mã nhân viên: {row.id}</div></div>},
      {key:'phoneNumber',title:'Số điện thoại'},
      {key:'account',title:'Tài khoản',render:row=>row.account?<div>{row.account.username}<div className={styles.muted}>Mã người dùng: {row.account.userId}</div></div>:'Chưa có tài khoản'},
      {key:'role',title:'Vai trò',render:row=>ROLE_LABELS[row.account?.role]||row.account?.role||'—'},
      {key:'status',title:'Trạng thái',render:row=>row.account?<span className={`${styles.badge} ${row.account.isActive==='locked'?styles.locked:''}`}>{row.account.isActive==='active'?'● Đang hoạt động':'⊘ Đã khóa'}</span>:'—'},
      {key:'employmentStatus',title:'Làm việc',render:row=>row.employmentStatus==='working'?'Đang làm việc':'Đã nghỉ việc'},
      {key:'actions',title:'Thao tác',render:row=>row.account&&hasPermission('STAFF_CHANGE_STATUS')&&<div>
        <Button variant="secondary" disabled={row.account.userId===user.userId||(row.account.isActive==='locked'&&row.employmentStatus!=='working')}
          onClick={()=>{setError('');setSelected(row);}}>{row.account.isActive==='active'?'Khóa tài khoản':'Mở khóa'}</Button>
        {row.account.userId===user.userId&&<div className={styles.muted}>Bạn không thể tự khóa tài khoản.</div>}
        {row.employmentStatus!=='working'&&<div className={styles.muted}>Không thể mở tài khoản đã nghỉ việc.</div>}
      </div>},
    ]}/>
    {visible.length>0&&<Pagination page={currentPage} pageSize={pageSize} totalItems={visible.length} totalPages={totalPages}
      onPageChange={setPage} onPageSizeChange={next=>{setPageSize(next);setPage(1);}}/>}</div>
    {selected&&<StaffDialog title={selected.account.isActive==='active'?'Xác nhận khóa tài khoản':'Xác nhận mở khóa tài khoản'} busy={busy} onClose={()=>setSelected(null)}>
      <p>{selected.fullName} · {selected.account.username}</p>
      <p>{selected.account.isActive==='active'?'Bạn có chắc chắn muốn khóa tài khoản này? Tất cả phiên đăng nhập sẽ bị thu hồi. Hồ sơ và lịch làm việc được giữ nguyên.':'Nhân viên có thể đăng nhập lại bằng mật khẩu hiện tại. Các phiên đã thu hồi sẽ không được khôi phục.'}</p>
      <ErrorMessage message={error} inline/>
      <div className={styles.actions}><Button variant="secondary" disabled={busy} onClick={()=>setSelected(null)}>Hủy</Button><Button variant={selected.account.isActive==='active'?'danger':'primary'} loading={busy} onClick={change}>Đồng ý</Button></div>
    </StaffDialog>}
  </div>;
}
