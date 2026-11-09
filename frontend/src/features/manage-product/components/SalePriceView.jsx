'use client';

import React from 'react';
import Link from 'next/link';
import Spinner from '@/shared/components/Spinner';
import ErrorMessage from '@/shared/components/ErrorMessage';
import PriceHistoryTable from './PriceHistoryTable';
import PriceUpdateForm from './PriceUpdateForm';
import { useProductPrice } from '../hooks/useProductPrice';
import styles from './sale-price.module.css';

function getStatusBadge(status) {
  switch (status) {
    case 'Selling':
      return <span className={`${styles.badge} ${styles.badgeSelling}`}>Đang bán</span>;
    case 'StopSelling':
      return <span className={`${styles.badge} ${styles.badgeStopSelling}`}>Ngừng bán</span>;
    case 'Suspended':
      return <span className={`${styles.badge} ${styles.badgeSuspended}`}>Tạm ngưng</span>;
    default:
      return status ? <span className={styles.badge}>{status}</span> : null;
  }
}

function formatCurrency(val) {
  if (val === null || val === undefined || isNaN(val)) return '0 ₫';
  return Number(val).toLocaleString('vi-VN') + ' ₫';
}

export default function SalePriceView({ productId, variantId, permissions = [] }) {
  const {
    data,
    loading,
    error,
    updating,
    updateError,
    successMsg,
    reload,
    updatePrice,
    clearSuccessMsg,
    clearUpdateError,
  } = useProductPrice(productId, variantId);

  const canUpdate = permissions.includes('PRODUCT_PRICE_UPDATE');

  if (loading) {
    return <Spinner center />;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Link href="/products" className={styles.backLink}>
          &larr; Quay lại danh sách
        </Link>
        <ErrorMessage message={error} onRetry={reload} />
      </div>
    );
  }

  if (!data || !data.product || !data.variant) {
    return (
      <div className={styles.container}>
        <Link href="/products" className={styles.backLink}>
          &larr; Quay lại danh sách
        </Link>
        <ErrorMessage message="Không tìm thấy thông tin sản phẩm" onRetry={reload} />
      </div>
    );
  }

  const { product, variant, history } = data;

  return (
    <div className={styles.container}>
      <Link href="/products" className={styles.backLink}>
        &larr; Quay lại danh sách
      </Link>

      <div className={styles.card}>
        <div className={styles.productHeader}>
          <div className={styles.productInfo}>
            <h1 className={styles.productName}>{product.name}</h1>
            <div className={styles.productMeta}>
              <span>Mã SP: <span className={styles.productCode}>{product.code}</span></span>
              <span>•</span>
              <span>Đơn vị tính: <strong>{variant.unitName}</strong></span>
              {variant.barcode && (
                <>
                  <span>•</span>
                  <span>Mã vạch: <span className={styles.productCode}>{variant.barcode}</span></span>
                </>
              )}
            </div>
          </div>
          <div>{getStatusBadge(product.status)}</div>
        </div>

        <div className={styles.priceSection}>
          <div className={styles.currentPriceBlock}>
            <span className={styles.currentPriceLabel}>Giá bán hiện tại</span>
            <span className={styles.currentPriceValue}>{formatCurrency(variant.salePrice)}</span>
          </div>

          {canUpdate && (
            <PriceUpdateForm
              currentPrice={variant.salePrice}
              onUpdate={updatePrice}
              updating={updating}
              error={updateError}
              successMsg={successMsg}
              onClearError={clearUpdateError}
              onClearSuccess={clearSuccessMsg}
            />
          )}
        </div>
      </div>

      <div className={styles.historySection}>
        <h2 className={styles.historyTitle}>Lịch sử thay đổi giá</h2>
        <PriceHistoryTable history={history} />
      </div>
    </div>
  );
}

