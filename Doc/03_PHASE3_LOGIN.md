# PHASE 3 – Login (UC69)

> Đọc kèm `00_RULES.md`. Models đã làm ở PHASE 2 (`02_PHASE2_MODELS.md`), không tạo lại.
> **Phạm vi:** chỉ UC69.



### 6.1 Đặc tả UC69

- **Actor:** Manager, Cashier, Warehouse Staff
- **Mô tả:** Người dùng đăng nhập bằng username/password để truy cập hệ thống.
- **Tiền điều kiện:** Tài khoản đã được tạo (seed hoặc UC64).
- **Luồng chính:**
  1. Người dùng mở `/login`, nhập username, password, bấm "Đăng nhập".
  2. Hệ thống kiểm tra dữ liệu nhập.
  3. Hệ thống tìm tài khoản và so khớp mật khẩu (bcrypt).
  4. Hệ thống kiểm tra trạng thái tài khoản và trạng thái nhân viên.
  5. Hệ thống lấy danh sách quyền theo role, tạo JWT với thời hạn theo role.
  6. Hệ thống trả token và thông tin người dùng. Frontend lưu lại và chuyển tới `/products`.
- **Luồng ngoại lệ:**
  - E1: thiếu username/password → 400 `VALIDATION_FAILED`, hiển thị lỗi dưới ô nhập.
  - E2: sai username **hoặc** sai mật khẩu → 401 `INVALID_CREDENTIALS`, **cùng một thông báo** "Sai tên đăng nhập hoặc mật khẩu" (không tiết lộ username có tồn tại hay không).
  - E3: `Users.isActive = 'locked'` → 403 `ACCOUNT_LOCKED`. **Chỉ kiểm tra sau khi mật khẩu đúng.**
  - E4: `Staff.employmentStatus = 'resigned'` → 403 `ACCOUNT_LOCKED`.
- **Hậu điều kiện:** Có phiên đăng nhập hợp lệ. Nếu `requirePasswordChange = true`, frontend hiển thị banner "Bạn cần đổi mật khẩu" (UC71 Change Password làm sau; **chưa** chặn điều hướng).

### 6.2 Backend

**Endpoint**

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/auth/login` | public | Đăng nhập |
| GET | `/api/auth/me` | `authenticate` | Lấy lại thông tin phiên (khi F5 trang) |

**Request** `POST /api/auth/login`
```json
{ "username": "cashier01", "password": "Cashier@123" }
```
Validate: `username` string bắt buộc, 3–50 ký tự, trim; `password` string bắt buộc, tối đa 100 ký tự.

**Response 200**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "expiresIn": "12h",
    "user": {
      "userId": 2,
      "staffId": 2,
      "username": "cashier01",
      "fullName": "Trần Thị Thu",
      "role": "Cashier",
      "requirePasswordChange": false
    },
    "permissions": ["CATEGORY_VIEW", "PRODUCT_VIEW", "PRODUCT_PRICE_VIEW", "SCHEDULE_CHECK_IN", "CASH_HANDOVER_CREATE"]
  }
}
```
`GET /api/auth/me` trả `data = { user, permissions }` (không có token).

**Lỗi riêng (`auth/constants/auth.errors.js`):** `INVALID_CREDENTIALS` 401, `ACCOUNT_LOCKED` 403.

**Repository (`user.repository.js`)**: luôn trả về **model**, không trả row thô.
- `findLoginAccountByUsername(username)` → `LoginAccount | null`:
  ```sql
  SELECT u.id AS userId, u.username, u.passwordHash, u.isActive, u.requirePasswordChange,
         u.roleId, r.name AS role,
         s.id AS staffId, s.fullName, s.employmentStatus
  FROM dbo.Users u
  JOIN dbo.Roles r ON r.id = u.roleId
  LEFT JOIN dbo.Staff s ON s.userId = u.id      -- read-only join to Staff (allowed, rule 2)
  WHERE u.username = @username;
  ```
- `findLoginAccountById(userId)` → `LoginAccount | null`: cùng câu SELECT, lọc theo `u.id`. Dùng cho `/me` và middleware.
- `findPermissionKeysByRoleId(roleId)` → `string[]`:
  ```sql
  SELECT f.featureKey FROM dbo.RoleFeatures rf
  JOIN dbo.Features f ON f.id = rf.featureId
  WHERE rf.roleId = @roleId;
  ```

`LoginAccount` là read model **của auth**, nên auth không phải import model `Staff` của manage-staff (tránh phụ thuộc vòng `auth ↔ manage-staff`).

**Service (`auth.service.js`)**: module, theo đúng mẫu 5 bước ở mục 3.1. Quy tắc khóa và nghỉ việc **không** viết lại trong service mà gọi `account.canLogin()`.
```js
async function login(username, password) {
  const account = await userRepository.findLoginAccountByUsername(username);
  // E2: same error whether the username or the password is wrong
  if (!account || !(await comparePassword(password, account.passwordHash))) {
    throw new AppError(AUTH_ERRORS.INVALID_CREDENTIALS);
  }
  // E3 + E4: checked only after the password is correct
  if (!account.canLogin()) throw new AppError(AUTH_ERRORS.ACCOUNT_LOCKED);

  const permissions = await userRepository.findPermissionKeysByRoleId(account.roleId);
  const token = signToken({ ...account.toTokenPayload(), permissions });
  return {
    token,
    expiresIn: jwtConfig.expiresInByRole[account.role],
    user: account.toSessionUser(),
    permissions,
  };
}
```
- `getSession(userId)`: `findLoginAccountById` → nếu `!account || !account.canLogin()` thì `ACCOUNT_LOCKED` → trả `{ user: account.toSessionUser(), permissions }`.
- `getActiveAccount(userId)`: trả `LoginAccount` hoặc `null`, dùng cho middleware.
- Export thêm (để UC64/UC66 dùng sau, lần này chỉ cần khai báo hàm, thân hàm `throw new Error('Not implemented')`): `createAccount({ username, password, roleName }, tx)`, `setAccountStatus(userId, status, tx)`.

**Middleware `auth/middlewares/authenticate.js`**
1. Đọc header `Authorization: Bearer <token>`. Không có → 401 `UNAUTHENTICATED`.
2. `verifyToken`. Sai hoặc hết hạn → 401 `TOKEN_INVALID`.
3. `const account = await authService.getActiveAccount(payload.userId)`. Nếu `!account || !account.canLogin()` → 403 `ACCOUNT_LOCKED`. Nhờ vậy khóa tài khoản ở UC66 có hiệu lực ngay, không chờ token hết hạn.
4. Gắn `req.user = { userId, staffId, role, permissions }` (lấy từ token).

**`auth/index.js`** export `{ router, authenticate, authService }`.

**Routes**
```js
router.post('/login', validate(loginSchema), asyncHandler(controller.login));
router.get('/me', authenticate, asyncHandler(controller.me));
```

### 6.3 Frontend

**`shared/utils/tokenStorage.js`**: `getToken/setToken/clearToken`, `getSession/setSession` (localStorage key `retailone.token`, `retailone.session`). Mọi truy cập `window`/`localStorage` phải kiểm tra `typeof window !== 'undefined'`.

**`shared/utils/deviceId.js`**: tạo UUID một lần (`crypto.randomUUID()`), lưu localStorage `retailone.deviceId` (phục vụ NFR Auditing).

**`shared/services/apiClient.js`** (axios instance):
- `baseURL = API_BASE_URL`, `timeout: 10000`
- Request interceptor: gắn `Authorization: Bearer <token>` và `X-Device-Id`
- Response interceptor: trả `response.data.data`. Lỗi → ném object `{ status, code, message, details }`. Nếu status 401 và request **không phải** `/auth/login`: `clearToken()` rồi `window.location.href = '/login?expired=1'`.

**`features/auth/services/auth.service.js`**: `login(username, password)`, `getMe()`.

**`features/auth/components/AuthProvider.jsx`** (React Context): state `{ user, permissions, status: 'loading' | 'authenticated' | 'guest' }`.
- Khi mount: có token thì gọi `getMe()`. Thành công → `authenticated`; lỗi → `clearToken()` → `guest`.
- `login(username, password)`: gọi API, lưu token và session, set state.
- `logout()`: `clearToken()`, set `guest`, `router.replace('/login')` (logout chỉ ở client, không cần API).
- `hasPermission(key)`.

**`features/auth/hooks/useAuth.js`**: `useContext(AuthContext)`, ném lỗi nếu dùng ngoài Provider.

**`features/auth/components/RequireAuth.jsx`**: `loading` → `<Spinner/>`; `guest` → `router.replace('/login')`; `authenticated` → render `children`. Nhận prop tùy chọn `permission`; thiếu quyền thì hiện "Bạn không có quyền truy cập trang này".

**`features/auth/components/LoginForm.jsx`**
- Field: Tên đăng nhập, Mật khẩu (có nút hiện/ẩn), nút "Đăng nhập" (disabled + spinner khi đang gửi).
- Validate phía client giống backend (rỗng, độ dài) trước khi gọi API.
- Map lỗi theo `code`:
  - `INVALID_CREDENTIALS` → "Sai tên đăng nhập hoặc mật khẩu."
  - `ACCOUNT_LOCKED` → "Tài khoản đã bị khóa. Vui lòng liên hệ quản lý."
  - `VALIDATION_FAILED` → hiện lỗi dưới từng ô theo `details`
  - Lỗi mạng hoặc 500 → "Không kết nối được máy chủ. Vui lòng thử lại."
- Nếu URL có `?expired=1` → hiện "Phiên đăng nhập đã hết hạn."
- Thành công → `router.replace('/products')`.
- Enter trong ô mật khẩu sẽ submit. Autofocus ô username.

**`app/login/page.jsx`**: dùng `AuthLayout` + `LoginForm`. Nếu đã `authenticated` → chuyển thẳng `/products`.

**`app/(dashboard)/layout.jsx`**
```jsx
'use client';
import { RequireAuth, useAuth } from '@/features/auth';
import DashboardLayout from '@/shared/layouts/DashboardLayout';

export default function Layout({ children }) {
  return <RequireAuth><Shell>{children}</Shell></RequireAuth>;
}
function Shell({ children }) {
  const { user, permissions, logout } = useAuth();
  return <DashboardLayout user={user} permissions={permissions} onLogout={logout}>{children}</DashboardLayout>;
}
```
Nếu `user.requirePasswordChange` thì `DashboardLayout` hiện banner vàng "Bạn cần đổi mật khẩu trong lần đăng nhập đầu tiên."

### ✅ Kiểm tra Phase 3

| # | Thao tác | Kết quả mong đợi |
|---|---|---|
| 1 | `manager / Manager@123` | 200, role Manager, có `PRODUCT_PRICE_UPDATE`, chuyển tới `/products` |
| 2 | `cashier01 / sai` | 401 `INVALID_CREDENTIALS` |
| 3 | `khongtontai / abc` | 401, **cùng thông báo** với #2 |
| 4 | `locked01 / Locked@123` | 403 `ACCOUNT_LOCKED` |
| 5 | `locked01 / sai` | 401 `INVALID_CREDENTIALS` (không lộ là bị khóa) |
| 6 | username rỗng | 400 `VALIDATION_FAILED`, `details.username` |
| 7 | `newcashier` | đăng nhập được, có banner đổi mật khẩu |
| 8 | Đăng nhập, sau đó trong SSMS `UPDATE dbo.Users SET isActive='locked' WHERE username='cashier01'`, rồi gọi `/api/auth/me` | 403 `ACCOUNT_LOCKED` |
| 9 | Gọi `/api/auth/me` không có token | 401 `UNAUTHENTICATED` |
| 10 | F5 trang `/products` khi đã đăng nhập | vẫn giữ phiên |
| 11 | Response login | **không** chứa `passwordHash` |

---
