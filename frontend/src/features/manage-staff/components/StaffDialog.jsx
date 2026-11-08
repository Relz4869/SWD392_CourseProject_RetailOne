'use client';
import { useEffect,useRef } from 'react';
import styles from './staff.module.css';
export default function StaffDialog({title,children,busy,onClose}) {
  const ref=useRef(null);
  useEffect(()=>{const dialog=ref.current;dialog.showModal();return()=>dialog.close();},[]);
  return <dialog ref={ref} className={styles.dialog} aria-labelledby="staff-dialog-title"
    onCancel={event=>{event.preventDefault();if(!busy)onClose();}}>
    <h2 id="staff-dialog-title">{title}</h2>{children}
  </dialog>;
}
