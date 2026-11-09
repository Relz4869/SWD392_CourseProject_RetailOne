'use client';
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import PageHeader from '@/shared/components/PageHeader';
import Button from '@/shared/components/Button';
import FormField from '@/shared/components/FormField';
import ErrorMessage from '@/shared/components/ErrorMessage';
import Spinner from '@/shared/components/Spinner';
import {ROLE_LABELS} from '@/shared/constants/roles';
import * as api from '../services/staff.service';
import StaffDialog from './StaffDialog';
import styles from './staff.module.css';

const blank={fullName:'',phoneNumber:'',idCard:'',email:'',roleId:'',isActive:'active'};
function validate(form) {
  const errors={};
  if(!form.fullName.trim()||form.fullName.trim().length>100)errors.fullName='Vui lòng nhập họ tên (tối đa 100 ký tự)';
  if(!/^\+?\d+$/.test(form.phoneNumber.trim())||form.phoneNumber.trim().length>20)errors.phoneNumber='Số điện thoại chỉ gồm chữ số và dấu + ở đầu, tối đa 20 ký tự';
  if(!/^\d{1,20}$/.test(form.idCard.trim()))errors.idCard='Vui lòng nhập số giấy tờ tùy thân chỉ gồm chữ số (tối đa 20 ký tự)';
  if(form.email.trim()&&(form.email.trim().length>100||!/^[^\s@\u0080-\uFFFF]+@[^\s@\u0080-\uFFFF]+\.[^\s@\u0080-\uFFFF]+$/.test(form.email.trim())))errors.email='Địa chỉ email không hợp lệ';
  if(!form.roleId)errors.roleId='Vui lòng chọn vai trò';
  return errors;
}
export default function StaffFormView() {
  const router=useRouter();const [form,setForm]=useState(blank),[roles,setRoles]=useState([]),[errors,setErrors]=useState({}),[error,setError]=useState('');
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[credentials,setCredentials]=useState(null),[leaving,setLeaving]=useState(false);
  const lock=useRef(false),dirty=useRef(false),hasCredentials=useRef(false);
  dirty.current=JSON.stringify(form)!==JSON.stringify(blank);hasCredentials.current=!!credentials;
  async function loadRoles(){setLoading(true);setError('');try{setRoles(await api.getRoles());}catch(e){setError(e.message||'Không tải được vai trò');}finally{setLoading(false);}}
  useEffect(()=>{loadRoles();},[]);
  useEffect(()=>{
    const unload=e=>{if(dirty.current||hasCredentials.current||lock.current){e.preventDefault();e.returnValue='';}};
    const click=e=>{
      const link=e.target.closest('a[href]');
      if(!link||link.target==='_blank'||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||!dirty.current)return;
      if(lock.current||!window.confirm('Các thay đổi chưa được lưu. Bạn có muốn rời trang không?')){e.preventDefault();e.stopPropagation();}
    };
    window.addEventListener('beforeunload',unload);document.addEventListener('click',click,true);
    return()=>{window.removeEventListener('beforeunload',unload);document.removeEventListener('click',click,true);};
  },[]);
  async function submit(event){
    event.preventDefault();if(lock.current||credentials)return;
    const issues=validate(form);setErrors(issues);setError('');if(Object.keys(issues).length)return;
    lock.current=true;setBusy(true);
    try{const result=await api.createStaff(form);setCredentials(result.credentials);setForm(blank);setErrors({});}
    catch(e){
      const details=e.details||{};
      setErrors(Object.fromEntries(Object.entries(details).map(([key,value])=>[key,value==='This Phone number already exists'?'Số điện thoại này đã tồn tại':value])));
      setError(e.code==='DUPLICATE_PHONE'?'Số điện thoại này đã tồn tại':e.status===0?'Mất kết nối khi lưu. Hãy kiểm tra danh sách nhân viên trước khi thử lại; mật khẩu chỉ được trả về một lần.':e.message||'Không thể tạo tài khoản. Vui lòng thử lại.');
    }finally{lock.current=false;setBusy(false);}
  }
  function closeCredentials(){setCredentials(null);hasCredentials.current=false;dirty.current=false;router.replace('/staff');}
  function input(key,label,type='text'){
    const max={fullName:100,phoneNumber:20,idCard:20,email:100};
    return <FormField htmlFor={key} label={label} error={errors[key]}><input id={key} className="input" type={type} value={form[key]} maxLength={max[key]} disabled={busy}
      inputMode={key==='idCard'?'numeric':undefined} aria-invalid={!!errors[key]} aria-describedby={errors[key]?`${key}-error`:undefined}
      onChange={e=>{setForm(old=>({...old,[key]:e.target.value}));setErrors(old=>({...old,[key]:undefined}));}}/></FormField>;
  }
  return <div className={styles.stack}>
    <PageHeader title="Thêm nhân viên" subtitle="Tạo hồ sơ và tài khoản đăng nhập trong cùng một thao tác."/>
    <div className={styles.band}><h2>Khởi đầu an toàn cho thành viên mới.</h2><p>Mật khẩu ban đầu được tạo ngẫu nhiên. Nhân viên phải đổi mật khẩu trong lần đăng nhập đầu tiên.</p></div>
    {loading?<Spinner center/>:!roles.length?<ErrorMessage message={error||'Chưa có vai trò trong hệ thống'} onRetry={loadRoles}/>:<form className={styles.card} onSubmit={submit} noValidate>
      <ErrorMessage message={error} inline/>
      {input('fullName','Họ và tên *')}
      <div className={styles.grid}>{input('phoneNumber','Số điện thoại *','tel')}{input('idCard','Số giấy tờ tùy thân *')}{input('email','Email · Không bắt buộc','email')}
        <FormField htmlFor="roleId" label="Vai trò *" error={errors.roleId}><select id="roleId" className="input" disabled={busy} value={form.roleId} aria-invalid={!!errors.roleId} onChange={e=>setForm(old=>({...old,roleId:e.target.value}))}><option value="">Chọn vai trò</option>{roles.map(role=><option key={role.id} value={role.id}>{ROLE_LABELS[role.name]||role.name}</option>)}</select></FormField>
        <FormField htmlFor="isActive" label="Trạng thái tài khoản"><input id="isActive" className="input" value="Đang hoạt động" readOnly/></FormField>
      </div>
      <p className={styles.muted}>Mã người dùng và tên đăng nhập được tạo tự động. Mật khẩu chỉ xuất hiện một lần sau khi lưu thành công.</p>
      <div className={styles.actions}><Button type="submit" loading={busy}>Tạo tài khoản</Button><Button variant="secondary" disabled={busy} onClick={()=>dirty.current?setLeaving(true):router.push('/staff')}>Hủy</Button></div>
    </form>}
    {leaving&&<StaffDialog title="Bỏ các thay đổi chưa lưu?" onClose={()=>setLeaving(false)}><p>Hồ sơ và tài khoản sẽ không được tạo.</p><div className={styles.actions}><Button variant="secondary" onClick={()=>setLeaving(false)}>Ở lại</Button><Button variant="danger" onClick={()=>{dirty.current=false;router.push('/staff');}}>Bỏ thay đổi</Button></div></StaffDialog>}
    {credentials&&<StaffDialog title="Đã tạo tài khoản thành công" onClose={closeCredentials}>
      <p>Mật khẩu này chỉ hiển thị một lần. Hãy ghi lại và bàn giao trực tiếp qua kênh an toàn trước khi đóng. Nhân viên bắt buộc đổi mật khẩu khi đăng nhập lần đầu.</p>
      <dl className={styles.credentials}><dt>Mã người dùng</dt><dd>{credentials.userId}</dd><dt>Tên đăng nhập</dt><dd><code>{credentials.username}</code></dd><dt>Mật khẩu ban đầu</dt><dd><code>{credentials.initialPassword}</code></dd></dl>
      <Button onClick={closeCredentials}>Đã ghi lại và sẽ bàn giao an toàn</Button>
    </StaffDialog>}
  </div>;
}
