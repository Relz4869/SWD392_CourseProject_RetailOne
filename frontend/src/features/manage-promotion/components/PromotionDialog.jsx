'use client';
import { useEffect, useRef } from 'react';
import styles from './promotion.module.css';

export default function PromotionDialog({ title, onCancel, busy, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return <dialog ref={ref} className={styles.dialog} aria-labelledby="promotion-dialog-title"
    onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }}>
    <h2 id="promotion-dialog-title">{title}</h2>{children}
  </dialog>;
}
