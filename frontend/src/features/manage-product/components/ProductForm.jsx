'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FormField from '@/shared/components/FormField';
import Button from '@/shared/components/Button';
import { useCategoryOptions } from '../hooks/useCategoryOptions';
import { useCreateProduct } from '../hooks/useCreateProduct';
import styles from './product-form.module.css';

export default function ProductForm({ onSuccess }) {
  const router = useRouter();
  const { options: categories, loading: categoriesLoading } = useCategoryOptions();
  const { loading, error, fieldErrors, setFieldErrors, handleCreate, clearErrors } = useCreateProduct();

  const [form, setForm] = useState({
    code: '',
    name: '',
    categoryId: '',
    baseUnit: '',
    unitType: 'PIECE',
    salePrice: '',
    barcode: '',
    minThreshold: '0',
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleCodeChange = (e) => {
    const val = e.target.value.toUpperCase();
    handleChange('code', val);
  };

  const validateClient = () => {
    const errors = {};
    const trimmedCode = form.code.trim();
    const trimmedName = form.name.trim();
    const trimmedBaseUnit = form.baseUnit.trim();
    const priceNum = parseFloat(form.salePrice);
    const minThresholdNum = parseFloat(form.minThreshold);

    if (!trimmedCode) {
      errors.code = 'Mã sản phẩm là bắt buộc';
    } else if (!/^[A-Za-z0-9_-]+$/.test(trimmedCode)) {
      errors.code = 'Mã chỉ được chứa chữ cái, chữ số, gạch ngang và gạch dưới';
    } else if (trimmedCode.length > 50) {
      errors.code = 'Mã sản phẩm tối đa 50 ký tự';
    }

    if (!trimmedName) {
      errors.name = 'Tên sản phẩm là bắt buộc';
    } else if (trimmedName.length > 200) {
      errors.name = 'Tên sản phẩm tối đa 200 ký tự';
    }

    if (!trimmedBaseUnit) {
      errors.baseUnit = 'Đơn vị tính gốc là bắt buộc';
    } else if (trimmedBaseUnit.length > 20) {
      errors.baseUnit = 'Đơn vị tính tối đa 20 ký tự';
    }

    if (form.salePrice === '' || isNaN(priceNum) || priceNum < 0) {
      errors.salePrice = 'Giá bán phải là số >= 0';
    }

    if (form.barcode && form.barcode.trim()) {
      const trimmedBarcode = form.barcode.trim();
      if (!/^\d+$/.test(trimmedBarcode)) {
        errors.barcode = 'Mã vạch chỉ được chứa các chữ số';
      } else if (trimmedBarcode.length > 50) {
        errors.barcode = 'Mã vạch tối đa 50 ký tự';
      }
    }

    if (form.minThreshold !== '' && (isNaN(minThresholdNum) || minThresholdNum < 0)) {
      errors.minThreshold = 'Tồn tối thiểu phải là số >= 0';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearErrors();

    const clientErrors = validateClient();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      categoryId: form.categoryId ? parseInt(form.categoryId, 10) : null,
      baseUnit: form.baseUnit.trim(),
      unitType: form.unitType,
      salePrice: parseFloat(form.salePrice),
      barcode: form.barcode.trim() || null,
      minThreshold: form.minThreshold !== '' ? parseFloat(form.minThreshold) : 0,
    };

    try {
      const created = await handleCreate(payload);
      if (typeof onSuccess === 'function') {
        onSuccess(created);
      } else {
        router.push('/products');
      }
    } catch {
      // Error handled by hook
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {error && (
          <div className={styles.alert} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.formGrid}>
            {/* Cột trái: Thông tin cơ bản */}
            <div className={styles.column}>
              <h2 className={styles.sectionTitle}>Thông tin cơ bản</h2>

              <FormField
                label="Mã sản phẩm *"
                htmlFor="product-code"
                error={fieldErrors.code}
              >
                <input
                  id="product-code"
                  type="text"
                  className={`${styles.input} ${styles.mono} ${fieldErrors.code ? styles.inputError : ''}`}
                  placeholder="Ví dụ: SP00001"
                  value={form.code}
                  onChange={handleCodeChange}
                  maxLength={50}
                  disabled={loading}
                  required
                />
              </FormField>

              <FormField
                label="Tên sản phẩm *"
                htmlFor="product-name"
                error={fieldErrors.name}
              >
                <input
                  id="product-name"
                  type="text"
                  className={`${styles.input} ${fieldErrors.name ? styles.inputError : ''}`}
                  placeholder="Ví dụ: Cà phê đen đá"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  maxLength={200}
                  disabled={loading}
                  required
                />
              </FormField>

              <FormField
                label="Danh mục"
                htmlFor="product-category"
                error={fieldErrors.categoryId}
              >
                <select
                  id="product-category"
                  className={`${styles.select} ${fieldErrors.categoryId ? styles.inputError : ''}`}
                  value={form.categoryId}
                  onChange={(e) => handleChange('categoryId', e.target.value)}
                  disabled={loading || categoriesLoading}
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* Cột phải: Đơn vị tính & Giá */}
            <div className={styles.column}>
              <h2 className={styles.sectionTitle}>Đơn vị tính &amp; Giá bán</h2>

              <FormField
                label="Đơn vị tính gốc *"
                htmlFor="product-base-unit"
                error={fieldErrors.baseUnit}
              >
                <input
                  id="product-base-unit"
                  type="text"
                  className={`${styles.input} ${fieldErrors.baseUnit ? styles.inputError : ''}`}
                  placeholder="Ví dụ: Ly, Chai, Hộp, Kg..."
                  value={form.baseUnit}
                  onChange={(e) => handleChange('baseUnit', e.target.value)}
                  maxLength={20}
                  disabled={loading}
                  required
                />
              </FormField>

              <FormField label="Loại đơn vị" htmlFor="unit-type-toggle">
                <div className={styles.unitToggleGroup} id="unit-type-toggle">
                  <button
                    type="button"
                    className={`${styles.toggleBtn} ${form.unitType === 'PIECE' ? styles.toggleBtnActive : ''}`}
                    onClick={() => handleChange('unitType', 'PIECE')}
                    disabled={loading}
                  >
                    Đếm theo cái (nguyên)
                  </button>
                  <button
                    type="button"
                    className={`${styles.toggleBtn} ${form.unitType === 'WEIGHT' ? styles.toggleBtnActive : ''}`}
                    onClick={() => handleChange('unitType', 'WEIGHT')}
                    disabled={loading}
                  >
                    Cân theo khối lượng (thập phân)
                  </button>
                </div>
                <div className={styles.helperText}>
                  {form.unitType === 'WEIGHT'
                    ? 'Cho phép nhập số lượng thập phân (ví dụ: 1.25 kg).'
                    : 'Chỉ nhận số lượng nguyên (ví dụ: 1 cái, 2 lon).'}
                </div>
              </FormField>

              <FormField
                label="Giá bán (₫) *"
                htmlFor="product-sale-price"
                error={fieldErrors.salePrice}
              >
                <input
                  id="product-sale-price"
                  type="number"
                  min="0"
                  step="any"
                  className={`${styles.input} ${styles.inputRight} ${fieldErrors.salePrice ? styles.inputError : ''}`}
                  placeholder="0"
                  value={form.salePrice}
                  onChange={(e) => handleChange('salePrice', e.target.value)}
                  disabled={loading}
                  required
                />
              </FormField>

              <FormField
                label="Mã vạch (barcode)"
                htmlFor="product-barcode"
                error={fieldErrors.barcode}
              >
                <input
                  id="product-barcode"
                  type="text"
                  className={`${styles.input} ${styles.mono} ${fieldErrors.barcode ? styles.inputError : ''}`}
                  placeholder="Chỉ gồm các chữ số (tùy chọn)"
                  value={form.barcode}
                  onChange={(e) => handleChange('barcode', e.target.value)}
                  maxLength={50}
                  disabled={loading}
                />
              </FormField>

              <FormField
                label="Tồn tối thiểu"
                htmlFor="product-min-threshold"
                error={fieldErrors.minThreshold}
              >
                <input
                  id="product-min-threshold"
                  type="number"
                  min="0"
                  step={form.unitType === 'WEIGHT' ? '0.001' : '1'}
                  className={`${styles.input} ${styles.inputRight} ${fieldErrors.minThreshold ? styles.inputError : ''}`}
                  placeholder="0"
                  value={form.minThreshold}
                  onChange={(e) => handleChange('minThreshold', e.target.value)}
                  disabled={loading}
                />
              </FormField>
            </div>
          </div>

          <div className={styles.actions}>
            <Link href="/products">
              <Button variant="secondary" disabled={loading}>
                Hủy
              </Button>
            </Link>
            <Button variant="primary" type="submit" loading={loading}>
              Tạo sản phẩm
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

