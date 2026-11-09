'use client';
import {useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {useAuth} from './AuthProvider';
import FormField from '@/shared/components/FormField';
import Button from '@/shared/components/Button';
import ErrorMessage from '@/shared/components/ErrorMessage';
import styles from './LoginForm.module.css';
export default function ChangePasswordForm(){
  const {user,changePassword,logout}=useAuth();const router=useRouter();
  const [values,setValues]=useState({currentPassword:'',newPassword:'',confirmPassword:''}),[errors,setErrors]=useState({}),[error,setError]=useState(''),[busy,setBusy]=useState(false);const lock=useRef(false);
  async function submit(event){
    event.preventDefault();if(lock.current)return;
    const issues={};
    if(!values.currentPassword)issues.currentPassword='Vui lòng nhập mật khẩu hiện tại';
    if(values.newPassword.length<12||new TextEncoder().encode(values.newPassword).length>72)issues.newPassword='Mật khẩu mới cần ít nhất 12 ký tự và tối đa 72 byte';
    if(values.newPassword!==values.confirmPassword)issues.confirmPassword='Mật khẩu xác nhận chưa khớp';
    setErrors(issues);setError('');if(Object.keys(issues).length)return;
    lock.current=true;setBusy(true);
    try{await changePassword({currentPassword:values.currentPassword,newPassword:values.newPassword});setValues({currentPassword:'',newPassword:'',confirmPassword:''});router.replace('/products');}
    catch(e){setError(e.message||'Không thể đổi mật khẩu. Vui lòng thử lại.');setErrors(e.details||{});}
    finally{lock.current=false;setBusy(false);}
  }
  return <form onSubmit={submit} className={styles.form} noValidate>
    <p>{user?.requirePasswordChange?'Bạn cần đổi mật khẩu ban đầu trước khi sử dụng hệ thống.':'Đặt mật khẩu mới cho tài khoản của bạn.'}</p>
    <ErrorMessage message={error} inline/>
    {[['currentPassword','Mật khẩu hiện tại'],['newPassword','Mật khẩu mới'],['confirmPassword','Xác nhận mật khẩu mới']].map(([key,label])=><FormField key={key} htmlFor={key} label={label} error={errors[key]}><input id={key} className="input" type="password" value={values[key]} disabled={busy} autoComplete={key==='currentPassword'?'current-password':'new-password'} aria-invalid={!!errors[key]} onChange={e=>setValues(old=>({...old,[key]:e.target.value}))}/></FormField>)}
    <Button type="submit" loading={busy} block>Đổi mật khẩu và tiếp tục</Button><Button variant="secondary" disabled={busy} onClick={logout} block>Đăng xuất</Button>
  </form>;
}
