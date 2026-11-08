# RetailOne POS – Quy tắc chung (đọc cùng mọi file PHASE)

> File này ngắn, đọc đủ mỗi lượt. Chi tiết từng phase ở `01_PHASE1_SKELETON.md`, `02_PHASE2_MODELS.md`, `03_PHASE3_LOGIN.md`, `04_PHASE4_PRODUCTLIST.md`.
> Trong repo này, `docs/` = thư mục `Doc/`, `database/` = thư mục `Database/`.

## 1. Bối cảnh dự án

- **RetailOne Integrated Retail POS System (RPS)**: hệ thống POS web cho một cửa hàng bán lẻ vừa và nhỏ.
- **Actor:** `Manager`, `Cashier`, `Warehouse` (Warehouse Staff).
- **Database:** Microsoft SQL Server, database `RetailOnePOS`, được tạo **sẵn** bằng `database/RetailOne_DB_Schema.sql` (DB-first). File SQL là **nguồn sự thật duy nhất** về bảng, cột, ràng buộc.
- **Quyết định kiến trúc:** *Client–Server for deployment, components for structure, OO for behavior.*
  - **Client–Server:** tách `backend/` và `frontend/`, chỉ nói chuyện qua REST API. Một SQL Server trung tâm, nghiệp vụ nhiều bước chạy trong transaction.
  - **Components:** bên trong mỗi bên chia theo **component (feature-first)**, mỗi component lại chia tầng.
  - **OO for behavior:** quy tắc nghiệp vụ nằm trong **domain model** (class có dữ liệu + phương thức). Service chỉ điều phối các bước, không tự viết lại quy tắc. Chi tiết ở mục 3.1.

### 1.1 15 UC và component sở hữu

| Component | UC | Bảng sở hữu (chỉ component này được INSERT/UPDATE/DELETE) | Người |
|---|---|---|---|
| `auth` | 69 Login | Users, Roles, Features, RoleFeatures | PhuNT |
| `manage-product` | 39, 42, 46, **48** | Categories, Products, ProductVariants, ProductSalePriceHistories | PhuNT |
| `manage-promotion` | 53, 54, 56 | Promotions, PromotionProducts | MaiCT |
| `manage-staff` | 64, 66 | Staff | MaiCT |
| `manage-shift` | 75, 81, 73 | Shifts, WorkSchedules | HiepND |
| `cash-handover` | 82, 83 | CashHandovers | HiepND |
| `sales` (stub) | – | (Invoices, Payments – làm sau) | – |

`InventoryStocks` thuộc component tồn kho tương lai (FE-03). Hiện tại `manage-product` **chỉ được đọc** bảng này (model read-only).

---

## 2. Tech stack (cố định, không đổi)

### Backend
- Node.js 20+, **JavaScript (CommonJS)**, không TypeScript
- `express@4`, `mssql@11` (driver tedious), `jsonwebtoken@9`, `bcryptjs@2` (**không** dùng `bcrypt` native vì dễ lỗi build trên Windows), `dotenv@16`, `cors@2`
- Dev: `nodemon@3`
- **Không dùng ORM** (không Sequelize/Prisma). Truy vấn bằng `mssql` với **parameterized query** trong tầng repository. Lý do: schema có computed column, filtered unique index, nhiều CHECK constraint, DB tạo bằng script.

### Frontend
- **Next.js 14 (App Router)**, React 18, **JavaScript**, thư mục `src/`, alias `@/*` → `src/*`
- `axios@1`
- CSS: `src/shared/styles/globals.css` + CSS Modules (`*.module.css`) đặt cạnh component
- Không dùng thư viện UI nặng (không MUI/Antd). Tự làm component đơn giản trong `shared/components`.

---

## 3. Quy tắc kiến trúc (BẮT BUỘC)

1. **Mỗi component chỉ lộ ra ngoài qua `index.js`.** Component A **không được** `require` file bên trong component B.
   ```js
   const { productService } = require('../manage-product');                 // ✅
   require('../manage-product/repositories/product.repository');            // ❌
   ```
2. **Mỗi bảng chỉ một component được ghi** (xem bảng 1.1). Component khác cần thì gọi **service** của component chủ.
   *Ngoại lệ:* truy vấn **chỉ đọc** phục vụ danh sách/báo cáo được JOIN bảng khác.
3. **`shared/` không phụ thuộc bất kỳ component nào.** Component phụ thuộc `shared/` và có thể phụ thuộc `auth` (để lấy middleware `authenticate`).
4. **Phụ thuộc giữa component một chiều, không vòng:**
   ```
   auth ← manage-staff ← manage-shift ← cash-handover
   auth ← manage-product ← manage-promotion
   ```
5. **Tầng trong component:**

   | Tầng | Được gọi | Cấm |
   |---|---|---|
   | routes | middlewares, controllers | chứa logic |
   | controllers | services (của mình) | SQL, gọi repository, nghiệp vụ |
   | services | repository của mình, models của mình, service component khác qua `index.js` | dùng `req`/`res`; tự viết `if` cho quy tắc đã có trong model |
   | repositories | `shared/config/database`, models của mình | quy tắc nghiệp vụ; trả row thô ra ngoài (phải map sang model) |
   | models | `shared/models/BaseModel`, `shared/utils`, `shared/constants` | gọi DB, ném `AppError`, dùng `req`/`res`, gọi service hoặc repository |

6. **Frontend đi một chiều:** `app/(page)` → `features/*/hooks` → `features/*/services` → `shared/services/apiClient`. Component giao diện **không** gọi API trực tiếp. Chỉ `apiClient` biết base URL và token.
7. **Page trong `app/` phải mỏng:** chỉ lắp ráp feature component, truyền `user`/`permissions` qua props. Feature A không import feature B (trừ `auth` cho hook `useAuth`).
8. **Bảo mật thật nằm ở backend.** Ẩn cột/menu ở frontend chỉ là giao diện; backend phải tự lọc dữ liệu theo role.
9. Không sửa file SQL schema. Nếu thấy cần sửa, ghi vào `docs/SCHEMA_NOTES.md` và báo lại, **không tự sửa**.
10. Comment trong code: tiếng Anh, ngắn, ghi rõ UC/BR liên quan (vd. `// UC48`, `// BR-57`).
11. Enum mà **từ 2 component trở lên** cần dùng (vd. trạng thái nhân viên `working`/`resigned`) đặt ở `shared/constants/`, model chủ chỉ tham chiếu lại. Như vậy component khác không phải import model của component chủ.

### 3.1 OO for behavior – chia trách nhiệm giữa model và service

**Model = tầng domain.** Mỗi model là class kế thừa `BaseModel`, chứa dữ liệu của một dòng và **các phương thức nghiệp vụ** của chính nó. Có 3 loại phương thức:

| Loại | Đặt tên | Trả về | Ví dụ |
|---|---|---|---|
| Truy vấn (query) | `isX()`, `canX()`, `hasX()` | `boolean` | `promotion.canBeDeleted(now)` |
| Tính toán | danh từ hoặc `toX()` | giá trị | `handover.difference()`, `variant.toBaseQuantity(3)` |
| Thay đổi (command) | động từ | `this`, hoặc đối tượng mới phát sinh | `schedule.checkIn(now, shift, cash)`, `variant.changePrice(...)` trả về `ProductSalePriceHistory` |

Quy tắc cho model:
- Phương thức phụ thuộc thời gian **nhận `now` làm tham số** (mặc định `new Date()`), để test được mà không phụ thuộc giờ máy.
- Model **không** ném `AppError` và không biết HTTP. Query trả `boolean`, service tự quyết định mã lỗi.
- Command **tự kiểm tra lại** điều kiện bằng query tương ứng. Nếu bị gọi sai, nó ném `Error` thường, vì đó là lỗi lập trình chứ không phải lỗi người dùng.
- Model không gọi DB. Import `sql` từ `shared/config/database` chỉ để khai báo kiểu cột.
- Không bắt mọi model phải có hành vi. Bảng thuần dữ liệu (`Role`, `Feature`, `RoleFeature`) chỉ cần cột.

**Service = tầng điều phối (application layer).** Service vẫn là **module export object chứa các hàm**, không viết thành class. Lý do: service không giữ trạng thái, và viết thành class kèm dependency injection làm tăng rủi ro lỗi khởi tạo hoặc require vòng mà không mang lại nhiều lợi ích ở quy mô này.

Mỗi hàm service đi theo đúng 5 bước:
```js
// UC56 – example of the service pattern
async function deletePromotion(promotionId, user) {
  const promotion = await promotionRepository.findById(promotionId);            // 1. load model
  if (!promotion) throw new AppError(PROMOTION_ERRORS.PROMOTION_NOT_FOUND);
  if (!promotion.canBeDeleted()) throw new AppError(PROMOTION_ERRORS.PROMOTION_RUNNING); // 2. ask model
  promotion.markDeleted();                                                       // 3. change via model
  await promotionRepository.updateStatus(promotion);                             // 4. save via repository
  return promotion;                                                              // 5. return model (controller sends toJSON)
}
```

**Repository** luôn trả về **instance của model** (qua `Model.fromRow(row)`), không trả row thô.

---
