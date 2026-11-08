'use client';

import PageHeader from '@/shared/components/PageHeader';
import { ProductForm } from '@/features/manage-product';

export default function NewProductPage() {
  return (
    <div>
      <PageHeader
        title="Thêm sản phẩm mới"
        subtitle="Tạo sản phẩm với thông tin cơ bản, đơn vị tính và giá bán ban đầu"
      />
      <ProductForm />
    </div>
  );
}
