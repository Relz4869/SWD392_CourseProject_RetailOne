'use client';

import React, { useState } from 'react';
import PageHeader from '@/shared/components/PageHeader';
import Button from '@/shared/components/Button';
import ErrorMessage from '@/shared/components/ErrorMessage';
import Spinner from '@/shared/components/Spinner';
import { useCategories } from '../hooks/useCategories';
import CategoryTree from './CategoryTree';
import CategoryFormModal from './CategoryFormModal';
import styles from './category.module.css';

export default function CategoryListView({ permissions = [] }) {
  const { categories, loading, error, reload, create } = useCategories();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const canCreate = permissions.includes('CATEGORY_CREATE');
  const rootCategories = categories.filter((c) => c.level === 0 && (c.status === 1 || c.status === true));

  const handleCreateSubmit = async (payload) => {
    await create(payload);
    setIsModalOpen(false);
    setSuccessToast(`Đã tạo danh mục "${payload.name}" thành công!`);
    setTimeout(() => {
      setSuccessToast('');
    }, 4000);
  };

  return (
    <div>
      <PageHeader
        title="Danh mục sản phẩm"
        subtitle={categories.length ? `${categories.length} danh mục` : undefined}
        actions={
          canCreate ? (
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              + Thêm danh mục
            </Button>
          ) : undefined
        }
      />

      {successToast && (
        <div className={styles.successToast} role="status">
          {successToast}
        </div>
      )}

      {error ? (
        <ErrorMessage message={error} onRetry={reload} />
      ) : loading && categories.length === 0 ? (
        <Spinner center size={32} />
      ) : (
        <CategoryTree categories={categories} loading={loading} />
      )}

      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateSubmit}
        rootCategories={rootCategories}
      />
    </div>
  );
}

