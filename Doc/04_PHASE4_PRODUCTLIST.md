# PHASE 4 – Product List (UC48)

> Đọc kèm `00_RULES.md`. Models ở `02_PHASE2_MODELS.md`, middleware `authenticate` đã có từ PHASE 3.
> **Phạm vi:** chỉ UC48. Mục 8 và 9 ở cuối file áp dụng cho cả dự án.



### 7.1 Đặc tả UC48

- **Actor:** Manager, Cashier, Warehouse Staff (quyền `PRODUCT_VIEW`)
- **Mô tả:** Xem danh sách sản phẩm cùng thông tin cơ bản để dùng trong công việc hằng ngày.
- **Tiền điều kiện:** Đã đăng nhập (UC69).
- **Luồng chính:**
  1. Người dùng mở menu "Sản phẩm".
  2. Hệ thống hiển thị danh sách có phân trang (mặc định 20 dòng, mới nhất trước).
  3. Người dùng có thể tìm theo tên, mã sản phẩm hoặc **quét mã vạch**; lọc theo danh mục; Manager lọc thêm theo trạng thái; sắp xếp; chuyển trang.
  4. Hệ thống cập nhật danh sách theo bộ lọc.
- **Luồng thay thế:**
  - A1: không có kết quả → hiện "Không tìm thấy sản phẩm phù hợp" và nút "Xóa bộ lọc".
  - A2: quét mã vạch (máy quét gõ chuỗi số rồi Enter) → tìm ngay, không chờ debounce.
- **Quy tắc theo role** (áp dụng ở **backend**, frontend chỉ ẩn cột cho khớp):

| | Manager | Cashier | Warehouse |
|---|---|---|---|
| Sản phẩm thấy được | mọi trạng thái | **chỉ `Selling`** (bỏ qua tham số `status`) | mọi trạng thái |
| Lọc theo `status` | có | không | có |
| `salePrice` | có | có | **không trả về** (NFR RBAC) |
| Sắp xếp theo giá | có | có | không (gửi lên → 400) |
| `imageUrl`, `variantCount`, `createdAt` | có | không | không |

- **NFR:** thời gian phản hồi < 1 giây với tải bình thường (NFR Performance). Dùng index sẵn có `IX_Products_Category`, `UX_Variants_Barcode`.

### 7.2 Backend

**Endpoint**

| Method | Path | Middleware | UC |
|---|---|---|---|
| GET | `/api/products` | `authenticate`, `protect(PRODUCT_VIEW)`, `validate(query)` | UC48 |
| GET | `/api/categories/options` | `authenticate`, `protect(CATEGORY_VIEW)` | hỗ trợ bộ lọc (không phải UC38) |

**Query params `GET /api/products`**

| Tham số | Kiểu | Mặc định | Ràng buộc |
|---|---|---|---|
| search | string | – | trim, tối đa 100 ký tự |
| categoryId | integer | – | nếu là danh mục cha thì **bao gồm cả danh mục con** |
| status | string | – | `Selling` \| `StopSelling` \| `Suspended` (bỏ qua nếu là Cashier) |
| page | integer | 1 | ≥ 1 |
| pageSize | integer | 20 | 1–100 |
| sortBy | string | `createdAt` | `name` \| `code` \| `createdAt` \| `salePrice` \| `stock` (whitelist, **không** nối chuỗi từ client vào SQL) |
| sortDir | string | `desc` | `asc` \| `desc` |

Query string là chuỗi, nên service phải ép kiểu số trước khi validate (hoặc validate dùng `pattern: /^\d+$/`).

**Item trả về (Manager)**
```json
{
  "id": 1,
  "code": "SP001",
  "name": "Coca-Cola lon 330ml",
  "imageUrl": null,
  "category": { "id": 2, "name": "Nước ngọt" },
  "baseUnit": "Lon",
  "baseVariantId": 1,
  "salePrice": 10000,
  "barcode": "8935049500018",
  "stockInBaseUnit": 240,
  "outOfStock": false,
  "variantCount": 3,
  "status": "Selling",
  "createdAt": "2026-11-08T17:00:00"
}
```
Cashier: bỏ `imageUrl`, `variantCount`, `createdAt`. Warehouse: bỏ thêm `salePrice`. Việc chọn field nằm **trong read model** `ProductListItem.toDTO(role)`, không viết `if (role === ...)` rải rác trong service.

**Read model `manage-product/models/productListItem.model.js`** (kế thừa `BaseModel`, không có `TABLE`)

`COLUMNS`: `id` (bigint), `code`, `name`, `imageUrl`, `baseUnit`, `status`, `createdAt`, `categoryId`, `categoryName`, `baseVariantId`, `salePrice`, `barcode`, `stockInBaseUnit`, `variantCount`.

| Thành phần | Mô tả |
|---|---|
| `static FIELDS_BY_ROLE` | Manager: tất cả. Cashier: `id, code, name, category, baseUnit, baseVariantId, salePrice, barcode, stockInBaseUnit, outOfStock`. Warehouse: như Cashier nhưng **không có** `salePrice`, và **có** `status` |
| `static SORTABLE_BY_ROLE` | Manager, Cashier: `name, code, createdAt, salePrice, stock`. Warehouse: `name, code, createdAt, stock` |
| `static forcedStatus(role)` | Cashier → `'Selling'`; role khác → `null` (không ép) |
| `static canFilterByStatus(role)` | Manager, Warehouse → `true`; Cashier → `false` |
| `static canSortBy(role, sortBy)` | `sortBy` có trong `SORTABLE_BY_ROLE[role]` |
| `isSellable()` | `status === 'Selling'` |
| `isOutOfStock()` | `stockInBaseUnit <= 0` |
| `toDTO(role)` | dựng object đầy đủ (gộp `category: { id, name }` hoặc `null`, thêm `outOfStock: this.isOutOfStock()`), rồi chỉ giữ các key trong `FIELDS_BY_ROLE[role]` |

Ca test bắt buộc (thêm vào 5.5): Warehouse `toDTO` **không** có key `salePrice`; Cashier không có `imageUrl`; `forcedStatus('Cashier') === 'Selling'`; `canSortBy('Warehouse', 'salePrice') === false`; tồn 0 → `outOfStock: true`.

**Repository (`product.repository.js` → `findPaged(filters)`)**
```sql
-- @categoryId: also include direct child categories
SELECT
  p.id, p.code, p.name, p.imageUrl, p.baseUnit, p.status, p.createdAt,
  c.id AS categoryId, c.name AS categoryName,
  bv.id AS baseVariantId, bv.salePrice, bv.barcode,
  ISNULL(st.stockInBaseUnit, 0) AS stockInBaseUnit,
  vc.variantCount,
  COUNT(*) OVER () AS totalCount
FROM dbo.Products p
LEFT JOIN dbo.Categories c ON c.id = p.categoryId
OUTER APPLY (
  SELECT TOP 1 v.id, v.salePrice, v.barcode
  FROM dbo.ProductVariants v
  WHERE v.productId = p.id
  ORDER BY v.conversionFactor ASC, v.id ASC
) bv
OUTER APPLY (
  SELECT SUM(s.quantityOnHand * v.conversionFactor) AS stockInBaseUnit
  FROM dbo.ProductVariants v
  JOIN dbo.InventoryStocks s ON s.variantId = v.id
  WHERE v.productId = p.id
) st
OUTER APPLY (
  SELECT COUNT(*) AS variantCount FROM dbo.ProductVariants v WHERE v.productId = p.id
) vc
WHERE (@search IS NULL
       OR p.name LIKE @searchLike
       OR p.code LIKE @searchLike
       OR EXISTS (SELECT 1 FROM dbo.ProductVariants v2 WHERE v2.productId = p.id AND v2.barcode = @search))
  AND (@categoryId IS NULL
       OR p.categoryId = @categoryId
       OR p.categoryId IN (SELECT id FROM dbo.Categories WHERE parentId = @categoryId))
  AND (@status IS NULL OR p.status = @status)
ORDER BY {ORDER_BY}          -- chosen from a whitelist map in code
OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
```
- `@searchLike = '%' + search + '%'`. Phải escape `%`, `_`, `[` trong chuỗi tìm kiếm.
- Map whitelist `ORDER_BY`: `name → p.name`, `code → p.code`, `createdAt → p.createdAt`, `salePrice → bv.salePrice`, `stock → stockInBaseUnit`. Luôn thêm `, p.id DESC` để thứ tự ổn định.
- Các tham số dùng đúng kiểu `sql` (`sql.NVarChar(100)`, `sql.Int`, `sql.VarChar(20)`).
- `totalCount` lấy từ dòng đầu; nếu không có dòng nào thì `totalItems = 0`.
- **Ghi chú:** tồn kho hiển thị = tổng `quantityOnHand` quy về đơn vị cơ bản. Tồn "bán được" (loại lô EXPIRED/DAMAGED theo BR-55) sẽ tính sau khi có component tồn kho. Ghi TODO.

**`category.repository.js` → `findActiveOptions()`**
```sql
SELECT id, name, parentId FROM dbo.Categories WHERE status = 1 ORDER BY name;
```
Service trả về dạng cây phẳng có `level` (cha level 0, con level 1) để dropdown thụt lề.

Repository map mỗi dòng bằng `ProductListItem.fromRow(row)` và trả về `{ items: ProductListItem[], totalItems }`.

**Service (`product.service.js` → `listProducts(query, user)`)**: module, chỉ điều phối; quy tắc role lấy từ `ProductListItem`.
```js
async function listProducts(query, user) {
  const filters = normalizeListQuery(query);                           // trim, numbers, defaults
  const { role } = user;

  if (!ProductListItem.canSortBy(role, filters.sortBy)) {
    throw new AppError(ERRORS.VALIDATION_FAILED, { sortBy: 'not allowed for this role' });
  }
  if (!ProductListItem.canFilterByStatus(role)) filters.status = null;
  filters.status = ProductListItem.forcedStatus(role) ?? filters.status; // Cashier: Selling only

  const { items, totalItems } = await productRepository.findPaged(filters);
  return {
    items: items.map((item) => item.toDTO(role)),
    page: filters.page,
    pageSize: filters.pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / filters.pageSize),
  };
}
```

**`manage-product/index.js`** export `{ productRouter, categoryRouter, productService, categoryService }`.

### 7.3 Frontend

**Route:** `app/(dashboard)/products/page.jsx`
```jsx
'use client';
import { useAuth } from '@/features/auth';
import { ProductListView } from '@/features/manage-product';
export default function ProductsPage() {
  const { user, permissions } = useAuth();
  return <ProductListView role={user.role} permissions={permissions} />;
}
```

**`features/manage-product/services/product.service.js`**: `getProducts(params)` → `apiClient.get('/products', { params })`. Bỏ các param rỗng trước khi gửi.

**`features/manage-product/services/category.service.js`**: `getCategoryOptions()`.

**`hooks/useProductList.js`**
- State: `filters { search, categoryId, status, sortBy, sortDir }`, `page`, `pageSize`, `data`, `loading`, `error`.
- Tìm kiếm **debounce 300 ms**. Hàm `searchNow()` (cho phím Enter hoặc máy quét) tìm ngay.
- Đổi bộ lọc hoặc sắp xếp → về `page = 1`.
- **Hủy request cũ** khi có request mới (AbortController) để tránh hiển thị kết quả cũ.
- Đồng bộ filter lên URL query (`?search=&categoryId=&page=`) để F5 vẫn giữ bộ lọc.
- Trả `{ filters, setFilter, resetFilters, page, setPage, data, loading, error, reload, searchNow }`.

**`hooks/useCategoryOptions.js`**: tải một lần, trả `{ options, loading }`.

**`constants/productColumns.js`**: cấu hình cột kèm role được thấy:

| key | Tiêu đề | Roles | Sắp xếp | Hiển thị |
|---|---|---|---|---|
| imageUrl | Ảnh | Manager | – | ảnh 40×40, không có thì ô xám |
| code | Mã SP | all | ✓ | |
| name | Tên sản phẩm | all | ✓ | |
| category | Danh mục | all | – | `category.name` hoặc "—" |
| baseUnit | ĐVT | all | – | |
| salePrice | Giá bán | Manager, Cashier | ✓ | `formatCurrency` → `10.000 ₫` |
| barcode | Mã vạch | all | – | font monospace |
| stockInBaseUnit | Tồn kho | all | ✓ | dựa vào field `outOfStock` từ API (không tự so sánh với 0) → chữ đỏ "Hết hàng" |
| variantCount | Số ĐVT bán | Manager | – | |
| status | Trạng thái | Manager, Warehouse | – | badge: Selling xanh "Đang bán", StopSelling xám "Ngừng bán", Suspended cam "Tạm ngưng" |

**`components/ProductFilterBar.jsx`**
- Ô tìm kiếm placeholder "Tìm theo tên, mã SP hoặc quét mã vạch…", autofocus. Enter → `searchNow()`.
- Dropdown danh mục ("Tất cả danh mục" + cây có thụt lề).
- Dropdown trạng thái: chỉ hiện với Manager và Warehouse.
- Nút "Xóa bộ lọc".

**`components/ProductTable.jsx`**: dùng `shared/components/DataTable` với cột lọc theo role. Bấm tiêu đề cột có ✓ để đổi `sortBy/sortDir` (hiện mũi tên ▲▼). Click dòng → `console.log` id (Product Detail UC49 làm sau, ghi TODO).

**`components/ProductListView.jsx`**: ghép `PageHeader` ("Danh sách sản phẩm" + tổng số), `ProductFilterBar`, `ProductTable`, `shared/components/Pagination` (Trước/Sau, số trang, chọn pageSize 10/20/50).
- Trạng thái: `loading` → skeleton hoặc spinner trong bảng (giữ nguyên bộ lọc); `error` → `ErrorMessage` + nút "Thử lại"; rỗng → `EmptyState` (A1).
- **Không** có nút "Thêm sản phẩm" lần này. Chỉ để chỗ trống có comment `{/* TODO UC42 - only if PRODUCT_CREATE */}`.

**`shared/utils/format.js`**: `formatCurrency(n)` dùng `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })`; `formatNumber(n)`; `formatDateTime(d)`.

### ✅ Kiểm tra Phase 4

| # | Thao tác | Kết quả mong đợi |
|---|---|---|
| 1 | Manager mở `/products` | thấy đủ sản phẩm (kể cả StopSelling, Suspended), đủ 10 cột |
| 2 | Cashier mở `/products` | chỉ thấy `Selling`, không có cột Ảnh/Số ĐVT/Trạng thái |
| 3 | Cashier gọi `GET /api/products?status=StopSelling` | vẫn chỉ trả `Selling` |
| 4 | Warehouse gọi `GET /api/products` | **không có** field `salePrice` trong JSON |
| 5 | Warehouse gọi `?sortBy=salePrice` | 400 `VALIDATION_FAILED` |
| 6 | Tìm `coca` | khớp theo tên, không phân biệt hoa thường |
| 7 | Dán đúng 1 barcode rồi Enter | ra đúng 1 sản phẩm, không chờ debounce |
| 8 | Tìm `50%` hoặc `a_b` | không lỗi, `%` và `_` được hiểu là ký tự thường |
| 9 | Lọc danh mục cha "Đồ uống" | có cả sản phẩm của "Nước ngọt" và "Bia" |
| 10 | `pageSize=500` | 400 `VALIDATION_FAILED` |
| 11 | `sortBy=name; DROP TABLE` | 400, không chạy SQL |
| 12 | Gõ nhanh nhiều ký tự | chỉ request cuối được hiển thị |
| 13 | F5 trang khi đang ở trang 2 có bộ lọc | giữ nguyên trang và bộ lọc |
| 14 | Gọi API không có token | 401 |
| 15 | Đo thời gian `GET /api/products` với dữ liệu seed | < 1 giây |

---

---

## 8. Cập nhật tài liệu sau khi xong

1. `docs/API.md`: ghi `POST /api/auth/login`, `GET /api/auth/me`, `GET /api/products`, `GET /api/categories/options` (request, response, mã lỗi).
2. `README.md` gốc: yêu cầu cài đặt (Node 20, SQL Server), các bước:
   - chạy `database/RetailOne_DB_Schema.sql` trong SSMS
   - `cd backend && cp .env.example .env && npm i && npm run seed && npm run dev`
   - `cd frontend && cp .env.local.example .env.local && npm i && npm run dev`
   - bảng tài khoản test ở mục 5.7
3. `docs/SCHEMA_NOTES.md`:
   - comment `Staff.userId` mâu thuẫn với NOT NULL
   - chưa có bảng `AuditLogs` cho NFR Auditing
   - tồn bán được (BR-55) cần component tồn kho

## 9. Quy ước commit gợi ý

Mỗi phase là các commit nhỏ, đặt tên theo Conventional Commits:
- `chore: init backend and frontend skeleton`
- `feat(models): add models for 15 UC tables`
- `feat(models): add domain behavior and unit tests`
- `chore(seed): add roles, features, test accounts and sample products`
- `feat(UC69): login API and authenticate middleware`
- `feat(UC69): login page and auth provider`
- `feat(UC48): product list API with role-based fields`
