'use client';

import React, { useState, useEffect, useRef } from 'react';
import FormField from '@/shared/components/FormField';
import Button from '@/shared/components/Button';
import styles from './category.module.css';

export default function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  rootCategories = [],
}) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const nameInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setParentId('');
      setErrorMsg('');
      setFieldErrors({});
      setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setFieldErrors({});

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFieldErrors({ name: 'Tên danh mục là bắt buộc' });
      return;
    }
    if (trimmedName.length > 100) {
      setFieldErrors({ name: 'Tên danh mục tối đa 100 ký tự' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: trimmedName,
        parentId: parentId ? parseInt(parentId, 10) : null,
      };
      await onSubmit(payload);
    } catch (err) {
      if (err.code === 'CATEGORY_NAME_EXISTS') {
        setFieldErrors({ name: 'Tên danh mục đã tồn tại trong cùng cấp' });
      } else if (err.code === 'CATEGORY_MAX_DEPTH') {
        setErrorMsg('Chỉ hỗ trợ 2 cấp danh mục');
      } else if (err.code === 'CATEGORY_INACTIVE') {
        setErrorMsg('Danh mục cha đang ngừng hoạt động');
      } else if (err.code === 'CATEGORY_NOT_FOUND') {
        setErrorMsg('Không tìm thấy danh mục cha');
      } else {
        setErrorMsg(err.message || 'Không thể tạo danh mục. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick} role="presentation">
      <div
        className={styles.modalDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-category-title"
      >
        <h2 id="modal-category-title" className={styles.modalTitle}>
          Thêm danh mục mới
        </h2>

        <form className={styles.modalForm} onSubmit={handleSubmit} noValidate>
          {errorMsg && (
            <div className={styles.errorBox} role="alert">
              {errorMsg}
            </div>
          )}

          <FormField label="Tên danh mục *" htmlFor="category-name" error={fieldErrors.name}>
            <input
              ref={nameInputRef}
              id="category-name"
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên danh mục…"
              maxLength={100}
              aria-invalid={Boolean(fieldErrors.name)}
              disabled={loading}
              required
            />
          </FormField>

          <FormField label="Danh mục cha" htmlFor="category-parent">
            <select
              id="category-parent"
              className="input"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              disabled={loading}
            >
              <option value="">Không có (danh mục gốc)</option>
              {rootCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </FormField>

          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Tạo danh mục
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
