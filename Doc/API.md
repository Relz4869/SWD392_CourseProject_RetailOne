# Hợp đồng API (API Contracts) - RetailOne

## 1. Authentication

### 1.1 POST /api/auth/login
- **Mô tả:** Đăng nhập hệ thống (UC69)
- **Middleware:** Không
- **Request Body:**
  ```json
  {
    "username": "manager",
    "password": "Password@123"
  }
  ```
- **Response 200 (Success):**
  ```json
  {
    "success": true,
    "data": {
      "token": "<JWT_STRING>",
      "user": {
        "userId": 1,
        "username": "manager",
        "role": "Manager",
        "staffId": 1,
        "fullName": "Nguyen Van Quan Ly",
        "requirePasswordChange": false,
        "permissions": ["PRODUCT_VIEW", "CATEGORY_VIEW", "..."]
      }
    }
  }
  ```
- **Mã lỗi:**
  - `400 VALIDATION_FAILED`: Thiếu hoặc sai định dạng username/password
  - `401 AUTH_INVALID_CREDENTIALS`: Sai username hoặc password
  - `403 AUTH_ACCOUNT_LOCKED`: Tài khoản bị khóa (`isActive = 0`) hoặc nhân viên đã thôi việc

### 1.2 GET /api/auth/me
- **Mô tả:** Lấy thông tin phiên làm việc hiện tại
- **Middleware:** `authenticate`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Response 200 (Success):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "userId": 1,
        "username": "manager",
        "role": "Manager",
        "staffId": 1,
        "fullName": "Nguyen Van Quan Ly",
        "requirePasswordChange": false,
        "permissions": ["PRODUCT_VIEW", "CATEGORY_VIEW", "..."]
      }
    }
  }
  ```
- **Mã lỗi:**
  - `401 UNAUTHENTICATED`: Thiếu hoặc sai header Authorization
  - `401 TOKEN_INVALID`: Token sai hoặc đã hết hạn

---

## 2. Products & Categories

### 2.1 GET /api/products
- **Mô tả:** Xem danh sách sản phẩm có phân trang, tìm kiếm, lọc danh mục/trạng thái và sắp xếp theo vai trò (UC48)
- **Middleware:** `authenticate`, `protect(PRODUCT_VIEW)`, `validate(query)`
- **Query Params:**
  - `search` (string, max 100): Tìm theo tên, mã SP hoặc barcode
  - `categoryId` (int, min 1): ID danh mục (bao gồm cả danh mục con)
  - `status` (string, oneOf: `Selling`, `StopSelling`, `Suspended`): Cashier luôn bị ép thành `Selling`
  - `page` (int, min 1, mặc định 1)
  - `pageSize` (int, 1-100, mặc định 20)
  - `sortBy` (string, oneOf: `name`, `code`, `createdAt`, `salePrice`, `stock`, mặc định `createdAt`) - Warehouse không được sắp xếp theo `salePrice`
  - `sortDir` (string, oneOf: `asc`, `desc`, mặc định `desc`)
- **Response 200 (Manager):**
  ```json
  {
    "success": true,
    "data": {
      "items": [
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
          "createdAt": "2026-11-08T17:00:00.000Z"
        }
      ],
      "page": 1,
      "pageSize": 20,
      "totalItems": 1,
      "totalPages": 1
    }
  }
  ```
  *(Cashier: bỏ `imageUrl`, `variantCount`, `createdAt`. Warehouse Staff: bỏ thêm `salePrice`)*
- **Mã lỗi:**
  - `400 VALIDATION_FAILED`: Tham số không hợp lệ hoặc vai trò không được sắp xếp theo cột yêu cầu
  - `401 UNAUTHENTICATED`: Chưa đăng nhập hoặc token không hợp lệ
  - `403 FORBIDDEN`: Không có quyền `PRODUCT_VIEW`

### 2.2 GET /api/categories/options
- **Mô tả:** Lấy danh sách danh mục đang hoạt động dạng cây phẳng (level 0 cha, level 1 con) phục vụ bộ lọc
- **Middleware:** `authenticate`, `protect(CATEGORY_VIEW)`
- **Response 200 (Success):**
  ```json
  {
    "success": true,
    "data": [
      { "id": 1, "name": "Đồ uống", "level": 0 },
      { "id": 2, "name": "Nước ngọt", "level": 1 },
      { "id": 3, "name": "Bia", "level": 1 }
    ]
  }
  ```
- **Mã lỗi:**
  - `401 UNAUTHENTICATED`: Chưa đăng nhập
  - `403 FORBIDDEN`: Không có quyền `CATEGORY_VIEW`
