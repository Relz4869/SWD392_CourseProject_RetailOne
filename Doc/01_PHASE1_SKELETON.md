# PHASE 1 – Khung xương project

> Đọc kèm `00_RULES.md`. Mục 3.1 (OO for behavior) ở trong `00_RULES.md`.
> **Phạm vi:** chỉ tạo khung. Models làm ở PHASE 2, Login ở PHASE 3, Product List ở PHASE 4.



### 4.1 Cây thư mục gốc

```
retailone/
├── backend/
├── frontend/
├── database/
│   ├── RetailOne_DB_Schema.sql
│   └── README.md            # thứ tự chạy: schema -> npm run seed
├── docs/
│   ├── AGENT_SPEC.md        # file này
│   ├── API.md               # hợp đồng API (cập nhật khi thêm endpoint)
│   └── SCHEMA_NOTES.md
├── .gitignore               # node_modules, .env, .next, dist, coverage
└── README.md                # cách cài, chạy, tài khoản test
```

### 4.2 Backend

```
backend/
├── package.json
├── .env.example
├── scripts/
│   └── seed.js
└── src/
    ├── server.js                       # kết nối DB rồi mới listen
    ├── app.js                          # middleware chung + gắn router từng component
    │
    ├── shared/
    │   ├── config/
    │   │   ├── env.js
    │   │   └── database.js             # pool, request(tx), withTransaction(fn)
    │   ├── constants/
    │   │   ├── roles.js
    │   │   ├── permissions.js          # PERMISSIONS + ROLE_PERMISSIONS (dùng cho seed)
    │   │   ├── staff.js                # EMPLOYMENT_STATUS (auth và manage-staff cùng dùng)
    │   │   └── errors.js               # lỗi dùng chung
    │   ├── middlewares/
    │   │   ├── permission.middleware.js   # protect(...keys)
    │   │   ├── validate.middleware.js
    │   │   ├── audit.middleware.js
    │   │   └── error.middleware.js        # notFound + errorHandler
    │   ├── models/
    │   │   └── BaseModel.js
    │   └── utils/
    │       ├── AppError.js
    │       ├── asyncHandler.js
    │       ├── response.js             # ok(), created(), paged()
    │       ├── password.js             # bcryptjs
    │       ├── jwt.js
    │       ├── date.js
    │       └── money.js                # roundMoney(n): làm tròn 2 chữ số
    │
    └── components/
        ├── auth/
        │   ├── index.js
        │   ├── routes/auth.routes.js
        │   ├── controllers/auth.controller.js
        │   ├── services/auth.service.js
        │   ├── repositories/user.repository.js
        │   ├── middlewares/authenticate.js
        │   ├── constants/auth.errors.js
        │   └── models/ role.model.js, feature.model.js, roleFeature.model.js, user.model.js,
        │               loginAccount.model.js (read model), *.test.js
        │
        ├── manage-product/
        │   ├── index.js
        │   ├── routes/ product.routes.js, category.routes.js
        │   ├── controllers/ product.controller.js, category.controller.js
        │   ├── services/ product.service.js, category.service.js
        │   ├── repositories/ product.repository.js, category.repository.js
        │   ├── constants/ product.errors.js
        │   └── models/ category.model.js, product.model.js, productVariant.model.js,
        │               productSalePriceHistory.model.js, inventoryStock.model.js,
        │               productListItem.model.js (read model), *.test.js
        │
        ├── manage-promotion/   index.js, routes/, controllers/, services/, repositories/,
        │                       models/ promotion.model.js, promotionProduct.model.js
        ├── manage-staff/       ... models/ staff.model.js
        ├── manage-shift/       ... models/ shift.model.js, workSchedule.model.js
        ├── cash-handover/      ... models/ cashHandover.model.js
        └── sales/
            └── index.js        # stub, xem 4.6
```

Với component **chưa làm** (`manage-promotion`, `manage-staff`, `manage-shift`, `cash-handover`): tạo đủ thư mục con (giữ bằng `.gitkeep`), tạo **models đầy đủ** (Phase 2), và `index.js` export `router` rỗng:
```js
// components/manage-staff/index.js
const router = require('express').Router();
// TODO UC64, UC66
module.exports = { router };
```

### 4.3 File cấu hình backend

**`backend/.env.example`**
```env
PORT=5000
CORS_ORIGIN=http://localhost:3000
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=RetailOnePOS
DB_USER=sa
DB_PASSWORD=your_password
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
JWT_SECRET=change_me_to_a_long_random_string
```

**`shared/config/env.js`**: đọc `.env` bằng dotenv, export object `{ port, corsOrigin, db, jwt }`. Các file khác **không** đọc `process.env` trực tiếp.
- `jwt.expiresInByRole = { Manager: '30m', Cashier: '12h', Warehouse: '12h' }` (NFR Security: ca thu ngân tối đa 12h, Manager timeout 30 phút).
- `db.options = { encrypt, trustServerCertificate, useUTC: false }`. **`useUTC: false` bắt buộc** để giờ lưu theo giờ cửa hàng (Asia/Bangkok).

**`shared/config/database.js`**
```js
const sql = require('mssql');
const { db } = require('./env');
let poolPromise = null;

function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(db).connect().catch((err) => { poolPromise = null; throw err; });
  }
  return poolPromise;
}

/** New request, bound to the transaction if tx is given. */
async function request(tx) {
  if (tx) return new sql.Request(tx);
  return (await getPool()).request();
}

/** Run work(tx) in one transaction. */
async function withTransaction(work) {
  const tx = new sql.Transaction(await getPool());
  await tx.begin();
  try { const r = await work(tx); await tx.commit(); return r; }
  catch (e) { await tx.rollback(); throw e; }
}

module.exports = { sql, getPool, request, withTransaction };
```
Mọi hàm repository có tham số cuối `tx` tùy chọn và dùng `request(tx)`.

**`app.js`** – gắn router:
```js
app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ success: true, data: 'ok' }));

app.use('/api/auth',           require('./components/auth').router);
app.use('/api/products',       require('./components/manage-product').productRouter);
app.use('/api/categories',     require('./components/manage-product').categoryRouter);
app.use('/api/promotions',     require('./components/manage-promotion').router);
app.use('/api/staff',          require('./components/manage-staff').router);
app.use('/api/shifts',         require('./components/manage-shift').router);
app.use('/api/cash-handovers', require('./components/cash-handover').router);

app.use(notFound);
app.use(errorHandler);
```

**`package.json` scripts:** `"dev": "nodemon src/server.js"`, `"start": "node src/server.js"`, `"seed": "node scripts/seed.js"`, `"test": "node --test"` (test runner có sẵn trong Node 20, tự tìm file `*.test.js`, không cần cài thêm thư viện).

**Read model:** class trong `models/` **không gắn với một bảng** (không có `TABLE`), dùng cho kết quả truy vấn JOIN nhiều bảng chỉ để đọc, ví dụ `LoginAccount` (UC69) và `ProductListItem` (UC48). Read model vẫn kế thừa `BaseModel` và có hành vi như model thường.

### 4.4 Chuẩn response và lỗi

- Thành công: `{ "success": true, "data": ... }`
- Danh sách có phân trang: `{ "success": true, "data": { "items": [...], "page": 1, "pageSize": 20, "totalItems": 135, "totalPages": 7 } }`
- Lỗi: `{ "success": false, "code": "PRODUCT_NOT_FOUND", "message": "...", "details": {...} }`

`AppError(def, details)` với `def = { status, code, message }`. Service ném `AppError`, controller không try/catch (dùng `asyncHandler`).

`error.middleware.js`:
- `AppError` → trả đúng status/code.
- Lỗi SQL `number` 2627 hoặc 2601 → 409 `DUPLICATE`; 547 → 400 `CONSTRAINT_VIOLATION`.
- Lỗi khác → log `console.error`, trả 500 `INTERNAL` (không lộ stack ra client).

**Lỗi dùng chung (`shared/constants/errors.js`):** `VALIDATION_FAILED` 400, `NOT_FOUND` 404, `DUPLICATE` 409, `CONSTRAINT_VIOLATION` 400, `UNAUTHENTICATED` 401, `TOKEN_INVALID` 401, `FORBIDDEN` 403, `INTERNAL` 500.

### 4.5 Middleware dùng chung

- **`protect(...permissionKeys)`**: đọc `req.user.permissions` (do `authenticate` gắn). Không có key nào → 403 `FORBIDDEN`. Chạy **sau** `authenticate`.
- **`validate(schema, source='body'|'query'|'params')`**: kiểm tra `required`, `type` (`string|number|integer|array|date|time|boolean`), `min`, `max`, `maxLength`, `pattern`, `oneOf`. Sai → 400 `VALIDATION_FAILED`, `details = { field: 'message' }`. Chỉ kiểm tra hình dạng; quy tắc nghiệp vụ để ở service.
- **`audit(action)`**: sau khi response xong và status < 400, ghi `console.info('[AUDIT]', {...})` gồm `action, userId, staffId, entityId, deviceId (header X-Device-Id), ip, at`. Schema **chưa có bảng AuditLogs** → ghi chú TODO.

### 4.6 Stub `sales`

```js
// components/sales/index.js
// Stub until FE-01 Sales is built. Other components depend on this contract, not on Invoices/Payments tables.
module.exports = {
  salesService: {
    async isPromotionUsed(promotionId) { return false; },          // used by UC56
    async getCashTotalBySchedule(scheduleId) { return 0; },        // used by UC82
  },
};
```

### 4.7 Frontend

```
frontend/
├── package.json
├── next.config.mjs
├── jsconfig.json                      # { "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["src/*"] } } }
├── .env.local.example                 # NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
└── src/
    ├── app/
    │   ├── layout.jsx                 # import globals.css, bọc <AuthProvider>
    │   ├── page.jsx                   # redirect('/products')
    │   ├── login/page.jsx             # UC69
    │   └── (dashboard)/
    │       ├── layout.jsx             # <RequireAuth> + <DashboardLayout>
    │       └── products/page.jsx      # UC48
    │
    ├── features/
    │   ├── auth/
    │   │   ├── index.js               # export AuthProvider, useAuth, LoginForm, RequireAuth
    │   │   ├── components/ AuthProvider.jsx, LoginForm.jsx, LoginForm.module.css, RequireAuth.jsx
    │   │   ├── hooks/useAuth.js
    │   │   └── services/auth.service.js
    │   ├── manage-product/
    │   │   ├── index.js               # export ProductListView
    │   │   ├── components/ ProductListView.jsx, ProductFilterBar.jsx, ProductTable.jsx, *.module.css
    │   │   ├── hooks/ useProductList.js, useCategoryOptions.js
    │   │   ├── services/ product.service.js, category.service.js
    │   │   └── constants/ productColumns.js
    │   ├── manage-promotion/index.js  # export {} – TODO
    │   ├── manage-staff/index.js
    │   ├── manage-shift/index.js
    │   └── cash-handover/index.js
    │
    └── shared/
        ├── components/ Button.jsx, DataTable.jsx, Pagination.jsx, FormField.jsx, PageHeader.jsx,
        │               Spinner.jsx, EmptyState.jsx, ErrorMessage.jsx
        ├── layouts/   AuthLayout.jsx, DashboardLayout.jsx, Sidebar.jsx, Header.jsx
        ├── routes/    paths.js, menu.js
        ├── services/  apiClient.js
        ├── constants/ permissions.js, roles.js       # copy y hệt key của backend
        ├── utils/     format.js, tokenStorage.js, deviceId.js, debounce.js
        ├── config/    index.js                        # API_BASE_URL
        └── styles/    globals.css
```

- Mọi component dùng state/hook phải có `'use client'`.
- **`shared/routes/menu.js`**: mảng `{ label, path, permission, enabled }` cho cả 15 UC. Chỉ `Products` có `enabled: true` lần này, còn lại `enabled: false` (hiển thị mờ, ghi "Sắp có").
- **`shared/layouts/DashboardLayout.jsx`** nhận props `user`, `permissions`, `onLogout`, `children`. Sidebar lọc menu theo `permissions`. Header hiện `fullName`, `role` và nút Đăng xuất. **Không import `features/auth`.**

### ✅ Kiểm tra Phase 1
- `cd backend && npm install && npm run dev` → `GET http://localhost:5000/api/health` trả `{ success: true, data: "ok" }` (cần DB đã tạo).
- `cd frontend && npm install && npm run dev` → mở `http://localhost:3000` không lỗi build.
- Chạy `grep -rnE "\.\./\.\./[a-z-]+/(routes|controllers|services|repositories|models|middlewares)/" backend/src/components | grep -v shared` → **không có kết quả** (không component nào import vào bên trong component khác).

---
