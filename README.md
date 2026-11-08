# RetailOne POS

Hệ thống POS web cho cửa hàng bán lẻ vừa và nhỏ (SWD392 Course Project).

## Yêu cầu môi trường
- **Node.js**: >= 20.x
- **Database**: Microsoft SQL Server (2019/2022) hoặc Azure SQL Edge

## Hướng dẫn cài đặt & khởi chạy

### 1. Khởi tạo cơ sở dữ liệu
- Mở SQL Server Management Studio (SSMS) hoặc Azure Data Studio.
- Chạy script tạo bảng: `Database/RetailOne_DB_Schema.sql`.
- (Tùy chọn) Chạy `Database/RetailOne_Demo_Records.sql` nếu muốn có sẵn dữ liệu mẫu của trường.

### 2. Backend
```bash
cd backend
cp .env.example .env
# Chỉnh sửa thông tin kết nối DB (DB_SERVER, DB_PORT, DB_USER, DB_PASSWORD, JWT_SECRET) trong .env
npm install
npm run seed     # Đồng bộ vai trò, tính năng, và 5 tài khoản test
npm run dev      # Khởi chạy server tại http://localhost:5000
```
Để chạy unit test:
```bash
npm test
```

### 3. Frontend
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev      # Khởi chạy Next.js tại http://localhost:3000
```
Để kiểm tra production build:
```bash
npm run build
```

---

## Danh sách tài khoản thử nghiệm (Test Accounts)

| Username | Password | Vai trò | Trạng thái | Mục đích kiểm thử |
|---|---|---|---|---|
| `manager` | `Password@123` | Manager | Hoạt động | Toàn quyền quản trị, xem đầy đủ trường sản phẩm |
| `cashier1` | `Password@123` | Cashier | Hoạt động | Thu ngân, chỉ xem sản phẩm đang bán, thấy giá bán |
| `cashier2` | `Password@123` | Cashier | Hoạt động | Thu ngân dự phòng |
| `warehouse1` | `Password@123` | Warehouse Staff | Hoạt động | Kho, lọc được trạng thái nhưng KHÔNG thấy giá bán |
| `locked_user` | `Password@123` | Cashier | Khóa (`isActive=0`) | Kiểm thử từ chối đăng nhập tài khoản bị khóa |
