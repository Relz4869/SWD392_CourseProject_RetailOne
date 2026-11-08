/* =======================================================================
 RetailOnePOS - FULL DEMO SEED (SQL Server)
 COVERAGE: 42 / 42 tables. Run AFTER RetailOne_schema_fixed.sql (or after
 correcting the missing comma in CREATE TABLE dbo.GoodReceiptItems).
 TEST DATA ONLY - fictitious people, suppliers, phone numbers and barcodes.
 ALL demo users: username below, common password supplied in README.
 SQL Server bcrypt passwordHash below was created via htpasswd bcrypt.
 BEHAVIOUR: transaction + run-once guard; re-running leaves data intact.
 Never execute against production.
 ======================================================================= */
USE [RetailOnePOS];
GO
SET NOCOUNT ON;
SET XACT_ABORT ON;
IF EXISTS (SELECT 1 FROM dbo.Users WHERE username = 'demo_manager')
BEGIN
    PRINT N'Demo data already exists (demo_manager found). No changes made.';
    RETURN;
END;
BEGIN TRY
  BEGIN TRANSACTION;
  DECLARE @Today DATE = CAST(GETDATE() AS DATE);
  DECLARE @Yesterday DATE = DATEADD(DAY,-1,@Today);
  DECLARE @TwoDaysAgo DATE = DATEADD(DAY,-2,@Today);
  DECLARE @ThreeDaysAgo DATE = DATEADD(DAY,-3,@Today);
  DECLARE @Tomorrow DATE = DATEADD(DAY,1,@Today);
  DECLARE @NextWeek DATE = DATEADD(DAY,7,@Today);
  DECLARE @ManagerId BIGINT, @Manager2Id BIGINT;
  DECLARE @CashA BIGINT, @CashB BIGINT, @WarehouseA BIGINT, @WarehouseB BIGINT, @Resigned BIGINT, @Locked BIGINT;
  DECLARE @Counter1 BIGINT, @Counter2 BIGINT;
  DECLARE @ShiftMorning INT, @ShiftAfternoon INT, @ShiftWarehouse INT;
  DECLARE @WSA_Y INT, @WSB_Y INT, @WSA_D2 INT, @WSA_Today INT, @WSA_Tomorrow INT;
  DECLARE @WSWarehouse_Y INT, @WSWarehouse_Today INT, @WSWarehouse_Future INT, @WSWarehouseB_Y INT, @WSResigned INT;
  DECLARE @SupplierA INT, @SupplierB INT, @SupplierC INT, @SupplierInactive INT;
  DECLARE @PO_Received INT, @PO_Approved INT, @PO_Pending INT, @PO_Cancelled INT, @PO_Received2 INT;
  DECLARE @Receipt1 INT, @Receipt2 INT, @GRI_Cola INT, @GRI_Tea INT, @GRI_Apple INT;
  DECLARE @BatchCola1 BIGINT, @BatchCola2 BIGINT, @BatchChips BIGINT, @BatchReturned BIGINT;
  DECLARE @CustA BIGINT, @CustB BIGINT, @CustC BIGINT, @CustD BIGINT;
  DECLARE @PromoA BIGINT, @PromoB BIGINT, @PromoC BIGINT;
  DECLARE @VoucherA INT, @VoucherB INT;
  DECLARE @Inv1 BIGINT, @Inv2 BIGINT, @Inv3 BIGINT, @Inv4 BIGINT, @Inv5 BIGINT, @Inv6 BIGINT, @Inv7 BIGINT, @Inv8 BIGINT;
  DECLARE @Inv9 BIGINT, @Inv10 BIGINT, @Inv11 BIGINT, @Inv12 BIGINT, @Inv13 BIGINT, @Inv14 BIGINT;
  PRINT N'Seeding RetailOnePOS ...';
INSERT INTO dbo.Roles ([name], [description])
VALUES
  (N'Manager', N'Quản trị cửa hàng'),
  (N'Cashier', N'Thu ngân'),
  (N'Warehouse Staff', N'Nhân viên kho');

INSERT INTO dbo.Features ([featureKey], [description])
VALUES
  ('AUTH_LOGIN', N'Đăng nhập'),
  ('PROFILE_VIEW', N'Xem hồ sơ'),
  ('STAFF_VIEW', N'Xem nhân viên'),
  ('STAFF_CREATE', N'Tạo nhân viên'),
  ('STAFF_UPDATE', N'Sửa nhân viên'),
  ('STAFF_LOCK', N'Khóa tài khoản'),
  ('STAFF_RESIGN', N'Cho nghỉ việc'),
  ('PAYROLL_VIEW', N'Xem báo cáo lương'),
  ('CATEGORY_VIEW', N'Xem danh mục'),
  ('CATEGORY_MANAGE', N'Quản lý danh mục'),
  ('PRODUCT_VIEW', N'Xem sản phẩm'),
  ('PRODUCT_MANAGE', N'Quản lý sản phẩm'),
  ('PROMOTION_VIEW', N'Xem khuyến mãi'),
  ('PROMOTION_MANAGE', N'Quản lý khuyến mãi'),
  ('VOUCHER_VIEW', N'Xem voucher'),
  ('VOUCHER_MANAGE', N'Quản lý voucher'),
  ('SUPPLIER_VIEW', N'Xem nhà cung cấp'),
  ('SUPPLIER_MANAGE', N'Quản lý nhà cung cấp'),
  ('INVENTORY_VIEW', N'Xem kho'),
  ('INVENTORY_MANAGE', N'Điều chỉnh kho'),
  ('PROCUREMENT_VIEW', N'Xem đơn nhập'),
  ('PROCUREMENT_MANAGE', N'Quản lý đơn nhập'),
  ('SALES_POS', N'Sử dụng POS'),
  ('INVOICE_VIEW', N'Xem hóa đơn'),
  ('PAYMENT_PROCESS', N'Thanh toán'),
  ('SHIFT_VIEW', N'Xem ca làm'),
  ('SHIFT_ASSIGN', N'Phân ca'),
  ('SHIFT_CHECKIN', N'Chấm công vào'),
  ('SHIFT_CHECKOUT', N'Chấm công ra'),
  ('SHIFT_CASH_HANDOVER', N'Bàn giao tiền'),
  ('CASH_REPORT_VIEW', N'Báo cáo bàn giao'),
  ('EOD_CLOSE', N'Chốt ngày'),
  ('CUSTOMER_MANAGE', N'Quản lý khách'),
  ('REPORTS_VIEW', N'Báo cáo tổng hợp');

INSERT INTO dbo.RoleFeatures (roleId,featureId)
SELECT r.id, f.id FROM dbo.Roles r CROSS JOIN dbo.Features f
WHERE r.name = N'Manager'
   OR (r.name = N'Cashier' AND f.featureKey IN
      ('AUTH_LOGIN','PROFILE_VIEW','PRODUCT_VIEW','CATEGORY_VIEW','SALES_POS','INVOICE_VIEW','PAYMENT_PROCESS','SHIFT_VIEW','SHIFT_CHECKIN','SHIFT_CASH_HANDOVER','CUSTOMER_MANAGE'))
   OR (r.name = N'Warehouse Staff' AND f.featureKey IN
      ('AUTH_LOGIN','PROFILE_VIEW','PRODUCT_VIEW','CATEGORY_VIEW','INVENTORY_VIEW','INVENTORY_MANAGE','PROCUREMENT_VIEW','PROCUREMENT_MANAGE','SHIFT_VIEW','SHIFT_CHECKIN','SHIFT_CHECKOUT','SUPPLIER_VIEW'));
INSERT INTO dbo.Users (roleId,username,passwordHash,isActive,requirePasswordChange)
SELECT r.id, v.username, v.passwordHash, v.isActive, v.requirePasswordChange
FROM (VALUES
  ('demo_manager', '$2b$10$FFDl66sRx8lg/6pgCdSTM.TxNLxViWD2//1ZdrcHufnSd18zhwIWC', 'active', 0, N'Manager'),
  ('demo_manager2', '$2b$10$FFDl66sRx8lg/6pgCdSTM.TxNLxViWD2//1ZdrcHufnSd18zhwIWC', 'active', 0, N'Manager'),
  ('demo_cashier_a', '$2b$10$FFDl66sRx8lg/6pgCdSTM.TxNLxViWD2//1ZdrcHufnSd18zhwIWC', 'active', 0, N'Cashier'),
  ('demo_cashier_b', '$2b$10$FFDl66sRx8lg/6pgCdSTM.TxNLxViWD2//1ZdrcHufnSd18zhwIWC', 'active', 0, N'Cashier'),
  ('demo_warehouse_a', '$2b$10$FFDl66sRx8lg/6pgCdSTM.TxNLxViWD2//1ZdrcHufnSd18zhwIWC', 'active', 0, N'Warehouse Staff'),
  ('demo_warehouse_b', '$2b$10$FFDl66sRx8lg/6pgCdSTM.TxNLxViWD2//1ZdrcHufnSd18zhwIWC', 'active', 1, N'Warehouse Staff'),
  ('demo_resigned', '$2b$10$FFDl66sRx8lg/6pgCdSTM.TxNLxViWD2//1ZdrcHufnSd18zhwIWC', 'locked', 1, N'Cashier'),
  ('demo_locked', '$2b$10$FFDl66sRx8lg/6pgCdSTM.TxNLxViWD2//1ZdrcHufnSd18zhwIWC', 'locked', 0, N'Cashier')) v(username,passwordHash,isActive,requirePasswordChange,RoleName)
JOIN dbo.Roles r ON r.name=v.RoleName;

INSERT INTO dbo.Staff (userId,fullName,phoneNumber,email,salaryType,baseSalary,employmentStatus,idCard,resignationDate)
SELECT u.id,v.fullName,v.phoneNumber,v.email,v.salaryType,v.baseSalary,v.employmentStatus,v.idCard,v.resignationDate
FROM (VALUES
  ('demo_manager', N'Nguyễn Minh Quân', '0900001001', 'manager1@retailone.demo', 'monthly', 18000000, 'working', '000000000001', NULL),
  ('demo_manager2', N'Lê Thu Hà', '0900001002', 'manager2@retailone.demo', 'monthly', 16000000, 'working', '000000000002', NULL),
  ('demo_cashier_a', N'Trần Thanh An', '0900002001', 'cashier.a@retailone.demo', 'hourly', 30000, 'working', '000000000003', NULL),
  ('demo_cashier_b', N'Phạm Hoài Linh', '0900002002', 'cashier.b@retailone.demo', 'hourly', 28000, 'working', '000000000004', NULL),
  ('demo_warehouse_a', N'Vũ Minh Đức', '0900003001', 'warehouse.a@retailone.demo', 'hourly', 32000, 'working', '000000000005', NULL),
  ('demo_warehouse_b', N'Đặng Khánh Vy', '0900003002', 'warehouse.b@retailone.demo', 'hourly', 0, 'working', '000000000006', NULL),
  ('demo_resigned', N'Hoàng Quốc Bình', '0900002003', 'resigned@retailone.demo', 'hourly', 27000, 'resigned', '000000000007', DATEADD(DAY,-25,@Today)),
  ('demo_locked', N'Ngô Bảo Châu', '0900002004', 'locked@retailone.demo', 'hourly', 30000, 'working', '000000000008', NULL)) v(username,fullName,phoneNumber,email,salaryType,baseSalary,employmentStatus,idCard,resignationDate)
JOIN dbo.Users u ON u.username=v.username;
SELECT @ManagerId=s.id FROM dbo.Staff s JOIN dbo.Users u ON u.id=s.userId WHERE u.username='demo_manager';
SELECT @Manager2Id=s.id FROM dbo.Staff s JOIN dbo.Users u ON u.id=s.userId WHERE u.username='demo_manager2';
SELECT @CashA=s.id FROM dbo.Staff s JOIN dbo.Users u ON u.id=s.userId WHERE u.username='demo_cashier_a';
SELECT @CashB=s.id FROM dbo.Staff s JOIN dbo.Users u ON u.id=s.userId WHERE u.username='demo_cashier_b';
SELECT @WarehouseA=s.id FROM dbo.Staff s JOIN dbo.Users u ON u.id=s.userId WHERE u.username='demo_warehouse_a';
SELECT @WarehouseB=s.id FROM dbo.Staff s JOIN dbo.Users u ON u.id=s.userId WHERE u.username='demo_warehouse_b';
SELECT @Resigned=s.id FROM dbo.Staff s JOIN dbo.Users u ON u.id=s.userId WHERE u.username='demo_resigned';
SELECT @Locked=s.id FROM dbo.Staff s JOIN dbo.Users u ON u.id=s.userId WHERE u.username='demo_locked';
-- Additional fictitious employees: >30 rows for pagination UC63
DECLARE @n INT=1, @DemoUserId INT, @ExtraRoleId INT;
WHILE @n<=34
BEGIN
    SET @ExtraRoleId=(SELECT id FROM dbo.Roles WHERE name=CASE WHEN @n%3=0 THEN N'Warehouse Staff' ELSE N'Cashier' END);
    INSERT INTO dbo.Users(roleId,username,passwordHash,isActive,requirePasswordChange)
    VALUES(@ExtraRoleId,'demo_extra_'+RIGHT('000'+CAST(@n AS VARCHAR(3)),3),'$2b$10$FFDl66sRx8lg/6pgCdSTM.TxNLxViWD2//1ZdrcHufnSd18zhwIWC','active',1);
    SET @DemoUserId=CONVERT(INT,SCOPE_IDENTITY());
    INSERT INTO dbo.Staff(userId,fullName,phoneNumber,email,salaryType,baseSalary,employmentStatus,idCard)
    VALUES(@DemoUserId,N'Nhân viên demo '+RIGHT('000'+CAST(@n AS VARCHAR(3)),3),
           '0918'+RIGHT('000000'+CAST(@n AS VARCHAR(6)),6),
           'extra'+CAST(@n AS VARCHAR(3))+'@retailone.demo','hourly',26000+(@n%4)*1000,'working',
           '999'+RIGHT('000000000'+CAST(@n AS VARCHAR(9)),9));
    SET @n=@n+1;
END;
INSERT INTO dbo.Counters ([counterCode], [counterName], [status])
VALUES
  ('COUNTER-01', N'Quầy thu ngân số 1', 'ACTIVE'),
  ('COUNTER-02', N'Quầy thu ngân số 2', 'ACTIVE'),
  ('COUNTER-03', N'Quầy bảo trì', 'INACTIVE');

SELECT @Counter1=id FROM dbo.Counters WHERE counterCode='COUNTER-01';
SELECT @Counter2=id FROM dbo.Counters WHERE counterCode='COUNTER-02';
INSERT INTO dbo.Shifts ([name], [startTime], [endTime], [checkInStart], [checkInEnd], [checkOutDeadline], [isActive])
VALUES
  (N'Ca sáng', '08:00', '16:00', '07:30', '09:00', '17:00', 1),
  (N'Ca chiều', '13:00', '21:00', '12:30', '14:00', '22:00', 1),
  (N'Ca kho', '09:00', '17:00', '08:30', '10:00', '18:00', 1),
  (N'Ca cũ ngừng dùng', '10:00', '18:00', '09:30', '11:00', '19:00', 0);

SELECT @ShiftMorning=id FROM dbo.Shifts WHERE name=N'Ca sáng';
SELECT @ShiftAfternoon=id FROM dbo.Shifts WHERE name=N'Ca chiều';
SELECT @ShiftWarehouse=id FROM dbo.Shifts WHERE name=N'Ca kho';
INSERT INTO dbo.WorkSchedules(staffId,shiftId,workDate,checkInTime,checkOutTime,workedHours,status,attendanceRecord,penaltyAmount,openingCash,note)
VALUES (@CashA,@ShiftMorning,@Yesterday,DATEADD(MINUTE,482,CAST(@Yesterday AS DATETIME2(0))),DATEADD(MINUTE,961,CAST(@Yesterday AS DATETIME2(0))),7.98,'completed','OnTime',0,500000,NULL);
SET @WSA_Y=CONVERT(INT,SCOPE_IDENTITY());
INSERT INTO dbo.WorkSchedules(staffId,shiftId,workDate,checkInTime,checkOutTime,workedHours,status,attendanceRecord,penaltyAmount,openingCash,note)
VALUES (@CashB,@ShiftMorning,@Yesterday,DATEADD(MINUTE,503,CAST(@Yesterday AS DATETIME2(0))),DATEADD(MINUTE,960,CAST(@Yesterday AS DATETIME2(0))),7.62,'completed','Late',10000,300000,NULL);
SET @WSB_Y=CONVERT(INT,SCOPE_IDENTITY());
INSERT INTO dbo.WorkSchedules(staffId,shiftId,workDate,checkInTime,checkOutTime,workedHours,status,attendanceRecord,penaltyAmount,openingCash,note)
VALUES (@CashA,@ShiftMorning,@TwoDaysAgo,DATEADD(MINUTE,479,CAST(@TwoDaysAgo AS DATETIME2(0))),DATEADD(MINUTE,964,CAST(@TwoDaysAgo AS DATETIME2(0))),8.08,'completed','OnTime',0,450000,NULL);
SET @WSA_D2=CONVERT(INT,SCOPE_IDENTITY());
INSERT INTO dbo.WorkSchedules(staffId,shiftId,workDate,checkInTime,checkOutTime,workedHours,status,attendanceRecord,penaltyAmount,openingCash,note)
VALUES (@CashA,@ShiftMorning,@Today,DATEADD(MINUTE,480,CAST(@Today AS DATETIME2(0))),NULL,0,'working','OnTime',0,500000,NULL);
SET @WSA_Today=CONVERT(INT,SCOPE_IDENTITY());
INSERT INTO dbo.WorkSchedules(staffId,shiftId,workDate,checkInTime,checkOutTime,workedHours,status,attendanceRecord,penaltyAmount,openingCash,note)
VALUES (@CashA,@ShiftMorning,@Tomorrow,NULL,NULL,0,'assigned','OnTime',0,NULL,NULL);
SET @WSA_Tomorrow=CONVERT(INT,SCOPE_IDENTITY());
INSERT INTO dbo.WorkSchedules(staffId,shiftId,workDate,checkInTime,checkOutTime,workedHours,status,attendanceRecord,penaltyAmount,openingCash,note)
VALUES (@WarehouseA,@ShiftWarehouse,@Yesterday,DATEADD(MINUTE,545,CAST(@Yesterday AS DATETIME2(0))),DATEADD(MINUTE,1023,CAST(@Yesterday AS DATETIME2(0))),7.97,'completed','OnTime',0,NULL,NULL);
SET @WSWarehouse_Y=CONVERT(INT,SCOPE_IDENTITY());
INSERT INTO dbo.WorkSchedules(staffId,shiftId,workDate,checkInTime,checkOutTime,workedHours,status,attendanceRecord,penaltyAmount,openingCash,note)
VALUES (@WarehouseA,@ShiftWarehouse,@Today,DATEADD(MINUTE,540,CAST(@Today AS DATETIME2(0))),NULL,0,'working','OnTime',0,NULL,NULL);
SET @WSWarehouse_Today=CONVERT(INT,SCOPE_IDENTITY());
INSERT INTO dbo.WorkSchedules(staffId,shiftId,workDate,checkInTime,checkOutTime,workedHours,status,attendanceRecord,penaltyAmount,openingCash,note)
VALUES (@WarehouseB,@ShiftWarehouse,@Yesterday,DATEADD(MINUTE,552,CAST(@Yesterday AS DATETIME2(0))),DATEADD(MINUTE,1020,CAST(@Yesterday AS DATETIME2(0))),7.8,'completed','Late',5000,NULL,NULL);
SET @WSWarehouseB_Y=CONVERT(INT,SCOPE_IDENTITY());
INSERT INTO dbo.WorkSchedules(staffId,shiftId,workDate,checkInTime,checkOutTime,workedHours,status,attendanceRecord,penaltyAmount,openingCash,note)
VALUES (@WarehouseB,@ShiftWarehouse,@NextWeek,NULL,NULL,0,'assigned','OnTime',0,NULL,NULL);
SET @WSWarehouse_Future=CONVERT(INT,SCOPE_IDENTITY());
INSERT INTO dbo.WorkSchedules(staffId,shiftId,workDate,checkInTime,checkOutTime,workedHours,status,attendanceRecord,penaltyAmount,openingCash,note)
VALUES (@Resigned,@ShiftMorning,DATEADD(DAY,-30,@Today),DATEADD(MINUTE,480,CAST(DATEADD(DAY,-30,@Today) AS DATETIME2(0))),DATEADD(MINUTE,960,CAST(DATEADD(DAY,-30,@Today) AS DATETIME2(0))),8,'completed','OnTime',0,NULL,NULL);
SET @WSResigned=CONVERT(INT,SCOPE_IDENTITY());

INSERT INTO dbo.Customers ([phone], [name], [loyaltyPoints], [totalSpending], [status])
VALUES
  ('0920001001', N'Khách hàng Nguyễn Lan', 100, 0, 'Active'),
  ('0920001002', N'Khách hàng Trần Nam', 40, 0, 'Active'),
  ('0920001003', N'Khách hàng Lê Bình', 20, 0, 'Active'),
  ('0920001004', N'Khách hàng Phạm Hà', 0, 0, 'Inactive'),
  ('0920001005', N'Khách hàng bị khóa demo', 0, 0, 'Blocked'),
  ('0920001006', N'Khách hàng Vũ Ánh', 80, 0, 'Active');

SELECT @CustA=id FROM dbo.Customers WHERE phone='0920001001';
SELECT @CustB=id FROM dbo.Customers WHERE phone='0920001002';
SELECT @CustC=id FROM dbo.Customers WHERE phone='0920001003';
SELECT @CustD=id FROM dbo.Customers WHERE phone='0920001006';
INSERT INTO dbo.Categories ([name], [parentId], [status])
VALUES
  (N'Đồ uống', NULL, 1),
  (N'Đồ ăn nhẹ', NULL, 1),
  (N'Sữa & chế phẩm', NULL, 1),
  (N'Đồ gia dụng', NULL, 1),
  (N'Thực phẩm tươi', NULL, 1),
  (N'Danh mục ngừng bán', NULL, 0);

INSERT INTO dbo.Categories(name,parentId,status) VALUES
(N'Nước ngọt',(SELECT id FROM dbo.Categories WHERE name=N'Đồ uống'),1),
(N'Nước tinh khiết',(SELECT id FROM dbo.Categories WHERE name=N'Đồ uống'),1),
(N'Bánh kẹo',(SELECT id FROM dbo.Categories WHERE name=N'Đồ ăn nhẹ'),1),
(N'Trái cây',(SELECT id FROM dbo.Categories WHERE name=N'Thực phẩm tươi'),1);

INSERT INTO dbo.Products(code,name,categoryId,baseUnit,allowDecimalQuantity,isCombo,status)
SELECT v.code,v.name,c.id,v.baseUnit,v.allowDecimalQuantity,v.isCombo,v.status
FROM (VALUES
  ('DEMO-COLA330', N'Nước ngọt Cola lon 330ml', N'Nước ngọt', N'Lon', 0, 0, 'Selling'),
  ('DEMO-TEA500', N'Trà đào chai 500ml', N'Đồ uống', N'Chai', 0, 0, 'Selling'),
  ('DEMO-WATER500', N'Nước khoáng 500ml', N'Nước tinh khiết', N'Chai', 0, 0, 'Selling'),
  ('DEMO-JUICE1L', N'Nước cam hộp 1L', N'Đồ uống', N'Hộp', 0, 0, 'Selling'),
  ('DEMO-CHIPS', N'Khoai tây chiên 80g', N'Đồ ăn nhẹ', N'Gói', 0, 0, 'Selling'),
  ('DEMO-COOKIE', N'Bánh quy bơ 150g', N'Bánh kẹo', N'Hộp', 0, 0, 'Selling'),
  ('DEMO-CHOCO', N'Sô-cô-la đen 80g', N'Bánh kẹo', N'Thanh', 0, 0, 'Selling'),
  ('DEMO-MILK1L', N'Sữa tươi tiệt trùng 1L', N'Sữa & chế phẩm', N'Hộp', 0, 0, 'Selling'),
  ('DEMO-YOGURT', N'Sữa chua 100g', N'Sữa & chế phẩm', N'Hộp', 0, 0, 'Selling'),
  ('DEMO-TISSUE', N'Khăn giấy 180 tờ', N'Đồ gia dụng', N'Gói', 0, 0, 'Selling'),
  ('DEMO-SOAP', N'Nước rửa chén 750ml', N'Đồ gia dụng', N'Chai', 0, 0, 'Selling'),
  ('DEMO-APPLE', N'Táo đỏ bán theo kg', N'Trái cây', N'Kg', 1, 0, 'Selling'),
  ('DEMO-RICE', N'Gạo thơm bán theo kg', N'Thực phẩm tươi', N'Kg', 1, 0, 'Selling'),
  ('DEMO-COMBO', N'Combo đồ ăn nhẹ', N'Đồ ăn nhẹ', N'Bộ', 0, 1, 'Selling'),
  ('DEMO-OLD', N'Bánh cũ ngừng bán', N'Danh mục ngừng bán', N'Hộp', 0, 0, 'StopSelling'),
  ('DEMO-SUSPENDED', N'Nước uống đang tạm ngưng', N'Đồ uống', N'Chai', 0, 0, 'Suspended')) v(code,name,categoryName,baseUnit,allowDecimalQuantity,isCombo,status)
JOIN dbo.Categories c ON c.name=v.categoryName;

INSERT INTO dbo.ProductVariants(productId,unitName,conversionFactor,salePrice,barcode,unitType)
SELECT p.id,v.unitName,v.conversionFactor,v.salePrice,v.barcode,v.unitType
FROM (VALUES
  ('DEMO-COLA330', N'Lon', 1, 12000, '8999000000001', 'PIECE'),
  ('DEMO-COLA330', N'Lốc 6', 6, 68000, '8999000000002', 'PIECE'),
  ('DEMO-COLA330', N'Thùng 24', 24, 260000, '8999000000003', 'PIECE'),
  ('DEMO-TEA500', N'Chai', 1, 18000, '8999000000004', 'PIECE'),
  ('DEMO-WATER500', N'Chai', 1, 8000, '8999000000005', 'PIECE'),
  ('DEMO-WATER500', N'Lốc 6', 6, 45000, '8999000000006', 'PIECE'),
  ('DEMO-JUICE1L', N'Hộp', 1, 35000, '8999000000007', 'PIECE'),
  ('DEMO-CHIPS', N'Gói', 1, 16000, '8999000000008', 'PIECE'),
  ('DEMO-CHIPS', N'Thùng 12', 12, 180000, '8999000000009', 'PIECE'),
  ('DEMO-COOKIE', N'Hộp', 1, 25000, '8999000000010', 'PIECE'),
  ('DEMO-CHOCO', N'Thanh', 1, 28000, '8999000000011', 'PIECE'),
  ('DEMO-MILK1L', N'Hộp', 1, 32000, '8999000000012', 'PIECE'),
  ('DEMO-MILK1L', N'Thùng 12', 12, 365000, '8999000000013', 'PIECE'),
  ('DEMO-YOGURT', N'Hộp', 1, 9000, '8999000000014', 'PIECE'),
  ('DEMO-YOGURT', N'Lốc 4', 4, 34000, '8999000000015', 'PIECE'),
  ('DEMO-TISSUE', N'Gói', 1, 22000, '8999000000016', 'PIECE'),
  ('DEMO-SOAP', N'Chai', 1, 38000, '8999000000017', 'PIECE'),
  ('DEMO-APPLE', N'Kg', 1, 55000, '8999000000018', 'WEIGHT'),
  ('DEMO-RICE', N'Kg', 1, 25000, '8999000000019', 'WEIGHT'),
  ('DEMO-COMBO', N'Bộ', 1, 49000, '8999000000020', 'PIECE'),
  ('DEMO-OLD', N'Hộp', 1, 16000, '8999000000021', 'PIECE'),
  ('DEMO-SUSPENDED', N'Chai', 1, 14000, '8999000000022', 'PIECE')) v(productCode,unitName,conversionFactor,salePrice,barcode,unitType)
JOIN dbo.Products p ON p.code=v.productCode;
-- 35 extra products/variants for Product List pagination, no stock by design.
SET @n=1;
WHILE @n<=35
BEGIN
    INSERT INTO dbo.Products(code,name,categoryId,baseUnit,status)
    VALUES('DEMO-PRODUCT-'+RIGHT('000'+CAST(@n AS VARCHAR(3)),3),
           N'Sản phẩm danh sách demo '+RIGHT('000'+CAST(@n AS VARCHAR(3)),3),
           (SELECT id FROM dbo.Categories WHERE name=N'Đồ gia dụng'),N'Cái','Selling');
    DECLARE @PaginationProductId BIGINT=CONVERT(BIGINT,SCOPE_IDENTITY());
    INSERT INTO dbo.ProductVariants(productId,unitName,conversionFactor,salePrice,barcode,unitType)
    VALUES(@PaginationProductId,N'Cái',1,5000+@n*100,
           '8999010'+RIGHT('000000'+CAST(@n AS VARCHAR(6)),6),'PIECE');
    SET @n=@n+1;
END;
-- Cross-layer lookup examples use natural keys, never assume identity starts at 1.
INSERT INTO dbo.ProductSalePriceHistories(productId,variantId,oldSalePrice,newSalePrice,changedBy,changedAt)
SELECT p.id,v.id,x.oldPrice,x.newPrice,@ManagerId,DATEADD(DAY,x.offsetDays,CAST(@Today AS DATETIME2(0)))
FROM (VALUES
('DEMO-COLA330',N'Lon',11000,12000,-15),('DEMO-TEA500',N'Chai',16000,18000,-10),
('DEMO-CHIPS',N'Gói',15000,16000,-8),('DEMO-MILK1L',N'Hộp',30000,32000,-6),
('DEMO-TISSUE',N'Gói',20000,22000,-5)
) x(code,unitName,oldPrice,newPrice,offsetDays)
JOIN dbo.Products p ON p.code=x.code
JOIN dbo.ProductVariants v ON v.productId=p.id AND v.unitName=x.unitName;
INSERT INTO dbo.ProductCombos(parentProductId,childVariantId,quantity)
SELECT combo.id,v.id,x.qty FROM (VALUES
('DEMO-CHIPS',N'Gói',1),('DEMO-COOKIE',N'Hộp',1),('DEMO-COLA330',N'Lon',1)
) x(code,unitName,qty)
JOIN dbo.Products p ON p.code=x.code
JOIN dbo.ProductVariants v ON v.productId=p.id AND v.unitName=x.unitName
CROSS JOIN (SELECT id FROM dbo.Products WHERE code='DEMO-COMBO') combo;
INSERT INTO dbo.LabelPrintQueue(productId,barcode,quantity,status)
SELECT p.id,v.barcode,x.qty,x.status FROM (VALUES
('DEMO-COLA330',N'Lon',24,'Printed'),('DEMO-TEA500',N'Chai',10,'Pending'),('DEMO-CHIPS',N'Gói',3,'Cancelled')
) x(code,unitName,qty,status)
JOIN dbo.Products p ON p.code=x.code
JOIN dbo.ProductVariants v ON v.productId=p.id AND v.unitName=x.unitName;
INSERT INTO dbo.Suppliers ([name], [taxId], [phoneNumber], [contactInfo], [address], [returnPolicy], [status])
VALUES
  (N'Công ty phân phối Minh Phát', 'TAXDEMO00001', '0930000001', N'sales@minhphat.demo', N'Hà Nội (dữ liệu giả lập)', 'Returnable', 'Active'),
  (N'Nhà phân phối An Bình', 'TAXDEMO00002', '0930000002', N'hotline@anbinh.demo', N'Hà Nội (dữ liệu giả lập)', 'NonReturnable', 'Active'),
  (N'Nông sản Thảo Nguyên', 'TAXDEMO00003', '0930000003', N'contact@thaonguyen.demo', N'Hòa Lạc (dữ liệu giả lập)', 'Returnable', 'Active'),
  (N'Đại lý đã ngừng hợp tác', 'TAXDEMO00004', '0930000004', N'inactive@retailone.demo', N'Hà Nội (dữ liệu giả lập)', 'NonReturnable', 'Inactive'),
  (N'Cung ứng Đại Việt', 'TAXDEMO00005', '0930000005', N'order@daiviet.demo', N'Hà Nội (dữ liệu giả lập)', 'Returnable', 'Active');

SELECT @SupplierA=id FROM dbo.Suppliers WHERE taxId='TAXDEMO00001';
SELECT @SupplierB=id FROM dbo.Suppliers WHERE taxId='TAXDEMO00002';
SELECT @SupplierC=id FROM dbo.Suppliers WHERE taxId='TAXDEMO00003';
SELECT @SupplierInactive=id FROM dbo.Suppliers WHERE taxId='TAXDEMO00004';
-- 32 extra suppliers for UC89 pagination / searching.
SET @n=1;
WHILE @n<=32
BEGIN
  INSERT INTO dbo.Suppliers(name,taxId,phoneNumber,contactInfo,address,returnPolicy,status)
  VALUES(N'Nhà cung cấp demo '+RIGHT('000'+CAST(@n AS VARCHAR(3)),3),
         'TAXPAGE'+RIGHT('000000'+CAST(@n AS VARCHAR(6)),6),
         '0940'+RIGHT('000000'+CAST(@n AS VARCHAR(6)),6),
         N'contact'+CAST(@n AS NVARCHAR(4))+N'@supplier.demo',N'Hà Nội (giả lập)',
         CASE WHEN @n%2=0 THEN 'Returnable' ELSE 'NonReturnable' END,
         CASE WHEN @n%8=0 THEN 'Inactive' ELSE 'Active' END);
  SET @n=@n+1;
END;
INSERT INTO dbo.ProductSuppliers(productId,supplierId,status)
SELECT p.id,s.id,v.linkStatus FROM (VALUES
('DEMO-COLA330','TAXDEMO00001','ACTIVE'),('DEMO-TEA500','TAXDEMO00001','ACTIVE'),
('DEMO-WATER500','TAXDEMO00001','ACTIVE'),('DEMO-CHIPS','TAXDEMO00001','ACTIVE'),
('DEMO-COOKIE','TAXDEMO00002','ACTIVE'),('DEMO-TISSUE','TAXDEMO00002','ACTIVE'),('DEMO-TISSUE','TAXDEMO00001','ACTIVE'),
('DEMO-MILK1L','TAXDEMO00002','ACTIVE'),('DEMO-YOGURT','TAXDEMO00002','ACTIVE'),
('DEMO-APPLE','TAXDEMO00003','ACTIVE'),('DEMO-RICE','TAXDEMO00003','ACTIVE'),
('DEMO-OLD','TAXDEMO00004','INACTIVE'),('DEMO-SOAP','TAXDEMO00005','ACTIVE')
) v(productCode,taxId,linkStatus)
JOIN dbo.Products p ON p.code=v.productCode JOIN dbo.Suppliers s ON s.taxId=v.taxId;
INSERT INTO dbo.SupplierProductPrices(supplierId,variantId,price,createdAt,createdBy)
SELECT s.id,v.id,x.price,DATEADD(DAY,x.daysOffset,CAST(@Today AS DATETIME2(0))),@ManagerId
FROM (VALUES
('TAXDEMO00001','DEMO-COLA330',N'Lon',5900,-30),
('TAXDEMO00001','DEMO-COLA330',N'Lon',6000,-10),
('TAXDEMO00001','DEMO-TEA500',N'Chai',11000,-12),
('TAXDEMO00001','DEMO-WATER500',N'Chai',4000,-11),
('TAXDEMO00001','DEMO-CHIPS',N'Gói',9000,-11),
('TAXDEMO00002','DEMO-COOKIE',N'Hộp',16000,-10),
('TAXDEMO00002','DEMO-TISSUE',N'Gói',11000,-9),
('TAXDEMO00001','DEMO-TISSUE',N'Gói',11000,-9),
('TAXDEMO00002','DEMO-MILK1L',N'Hộp',22000,-9),
('TAXDEMO00002','DEMO-YOGURT',N'Hộp',5000,-9),
('TAXDEMO00003','DEMO-APPLE',N'Kg',25000,-8),
('TAXDEMO00003','DEMO-RICE',N'Kg',14500,-8),
('TAXDEMO00004','DEMO-OLD',N'Hộp',7000,-90),
('TAXDEMO00005','DEMO-SOAP',N'Chai',24000,-5)
) x(taxId,productCode,unitName,price,daysOffset)
JOIN dbo.Suppliers s ON s.taxId=x.taxId
JOIN dbo.Products p ON p.code=x.productCode
JOIN dbo.ProductVariants v ON v.productId=p.id AND v.unitName=x.unitName;
INSERT INTO dbo.PurchaseOrders(supplierId,supplierName,supplierTaxId,supplierPhone,supplierAddress,
    status,totalAmount,note,createdBy,createdAt,approvedBy,approvedAt,canceledBy,canceledAt,cancelReason)
SELECT s.id,s.name,s.taxId,s.phoneNumber,s.address,'RECEIVED',520000,N'Đã nhận đầy đủ',@WarehouseA,DATEADD(MINUTE,600,CAST(@ThreeDaysAgo AS DATETIME2(0))),
    @ManagerId,DATEADD(MINUTE,600,CAST(@ThreeDaysAgo AS DATETIME2(0))),
    NULL,NULL,
    NULL
FROM dbo.Suppliers s WHERE s.taxId='TAXDEMO00001';
SET @PO_Received=CONVERT(INT,SCOPE_IDENTITY());
INSERT INTO dbo.PurchaseOrders(supplierId,supplierName,supplierTaxId,supplierPhone,supplierAddress,
    status,totalAmount,note,createdBy,createdAt,approvedBy,approvedAt,canceledBy,canceledAt,cancelReason)
SELECT s.id,s.name,s.taxId,s.phoneNumber,s.address,'APPROVED',1100000,N'Đơn nhập demo',@WarehouseA,DATEADD(MINUTE,600,CAST(@Yesterday AS DATETIME2(0))),
    @ManagerId,DATEADD(MINUTE,600,CAST(@Yesterday AS DATETIME2(0))),
    NULL,NULL,
    NULL
FROM dbo.Suppliers s WHERE s.taxId='TAXDEMO00002';
SET @PO_Approved=CONVERT(INT,SCOPE_IDENTITY());
INSERT INTO dbo.PurchaseOrders(supplierId,supplierName,supplierTaxId,supplierPhone,supplierAddress,
    status,totalAmount,note,createdBy,createdAt,approvedBy,approvedAt,canceledBy,canceledAt,cancelReason)
SELECT s.id,s.name,s.taxId,s.phoneNumber,s.address,'PENDING',240000,N'Đơn nhập demo',@WarehouseA,DATEADD(MINUTE,600,CAST(@Today AS DATETIME2(0))),
    NULL,NULL,
    NULL,NULL,
    NULL
FROM dbo.Suppliers s WHERE s.taxId='TAXDEMO00001';
SET @PO_Pending=CONVERT(INT,SCOPE_IDENTITY());
INSERT INTO dbo.PurchaseOrders(supplierId,supplierName,supplierTaxId,supplierPhone,supplierAddress,
    status,totalAmount,note,createdBy,createdAt,approvedBy,approvedAt,canceledBy,canceledAt,cancelReason)
SELECT s.id,s.name,s.taxId,s.phoneNumber,s.address,'CANCELED',180000,N'Đơn nhập demo',@WarehouseA,DATEADD(MINUTE,600,CAST(@TwoDaysAgo AS DATETIME2(0))),
    NULL,NULL,
    @ManagerId,DATEADD(MINUTE,600,CAST(@TwoDaysAgo AS DATETIME2(0))),
    N'Nhà cung cấp không giao được hàng'
FROM dbo.Suppliers s WHERE s.taxId='TAXDEMO00001';
SET @PO_Cancelled=CONVERT(INT,SCOPE_IDENTITY());
INSERT INTO dbo.PurchaseOrders(supplierId,supplierName,supplierTaxId,supplierPhone,supplierAddress,
    status,totalAmount,note,createdBy,createdAt,approvedBy,approvedAt,canceledBy,canceledAt,cancelReason)
SELECT s.id,s.name,s.taxId,s.phoneNumber,s.address,'RECEIVED',750000,N'Đơn nhập demo',@WarehouseA,DATEADD(MINUTE,540,CAST(@ThreeDaysAgo AS DATETIME2(0))),
    @ManagerId,DATEADD(MINUTE,540,CAST(@ThreeDaysAgo AS DATETIME2(0))),
    NULL,NULL,
    NULL
FROM dbo.Suppliers s WHERE s.taxId='TAXDEMO00003';
SET @PO_Received2=CONVERT(INT,SCOPE_IDENTITY());

INSERT INTO dbo.PurchaseOrderItems(poId,variantId,quantity,costPrice,receivedQuantity)
SELECT @PO_Received,v.id,50,6000,50
FROM dbo.ProductVariants v JOIN dbo.Products p ON p.id=v.productId
WHERE p.code='DEMO-COLA330' AND v.unitName=N'Lon';
INSERT INTO dbo.PurchaseOrderItems(poId,variantId,quantity,costPrice,receivedQuantity)
SELECT @PO_Received,v.id,20,11000,20
FROM dbo.ProductVariants v JOIN dbo.Products p ON p.id=v.productId
WHERE p.code='DEMO-TEA500' AND v.unitName=N'Chai';
INSERT INTO dbo.PurchaseOrderItems(poId,variantId,quantity,costPrice,receivedQuantity)
SELECT @PO_Approved,v.id,100,11000,0
FROM dbo.ProductVariants v JOIN dbo.Products p ON p.id=v.productId
WHERE p.code='DEMO-TISSUE' AND v.unitName=N'Gói';
INSERT INTO dbo.PurchaseOrderItems(poId,variantId,quantity,costPrice,receivedQuantity)
SELECT @PO_Pending,v.id,60,4000,0
FROM dbo.ProductVariants v JOIN dbo.Products p ON p.id=v.productId
WHERE p.code='DEMO-WATER500' AND v.unitName=N'Chai';
INSERT INTO dbo.PurchaseOrderItems(poId,variantId,quantity,costPrice,receivedQuantity)
SELECT @PO_Cancelled,v.id,20,9000,0
FROM dbo.ProductVariants v JOIN dbo.Products p ON p.id=v.productId
WHERE p.code='DEMO-CHIPS' AND v.unitName=N'Gói';
INSERT INTO dbo.PurchaseOrderItems(poId,variantId,quantity,costPrice,receivedQuantity)
SELECT @PO_Received2,v.id,30,25000,30
FROM dbo.ProductVariants v JOIN dbo.Products p ON p.id=v.productId
WHERE p.code='DEMO-APPLE' AND v.unitName=N'Kg';
INSERT INTO dbo.GoodReceipts(poId,receivedBy,receivedAt,totalQuantity,totalValue,note)
VALUES(@PO_Received,@WarehouseA,DATEADD(MINUTE,600,CAST(@TwoDaysAgo AS DATETIME2(0))),70,520000,N'Nhập hàng nước uống');
SET @Receipt1=CONVERT(INT,SCOPE_IDENTITY());
INSERT INTO dbo.GoodReceipts(poId,receivedBy,receivedAt,totalQuantity,totalValue,note)
VALUES(@PO_Received2,@WarehouseB,DATEADD(MINUTE,660,CAST(@TwoDaysAgo AS DATETIME2(0))),30,750000,N'Nhập táo');
SET @Receipt2=CONVERT(INT,SCOPE_IDENTITY());
INSERT INTO dbo.GoodReceiptItems(receiptId,poItemId,receivedQuantity,unitCost,note)
SELECT @Receipt1,poi.id,50,6000,N'Đủ số lượng' FROM dbo.PurchaseOrderItems poi
JOIN dbo.ProductVariants v ON v.id=poi.variantId JOIN dbo.Products p ON p.id=v.productId
WHERE poi.poId=@PO_Received AND p.code='DEMO-COLA330';
SET @GRI_Cola=CONVERT(INT,SCOPE_IDENTITY());
INSERT INTO dbo.GoodReceiptItems(receiptId,poItemId,receivedQuantity,unitCost,note)
SELECT @Receipt1,poi.id,20,11000,N'Đủ số lượng' FROM dbo.PurchaseOrderItems poi
JOIN dbo.ProductVariants v ON v.id=poi.variantId JOIN dbo.Products p ON p.id=v.productId
WHERE poi.poId=@PO_Received AND p.code='DEMO-TEA500';
SET @GRI_Tea=CONVERT(INT,SCOPE_IDENTITY());
INSERT INTO dbo.GoodReceiptItems(receiptId,poItemId,receivedQuantity,unitCost,note)
SELECT @Receipt2,poi.id,30,25000,N'Táo đạt chất lượng' FROM dbo.PurchaseOrderItems poi
JOIN dbo.ProductVariants v ON v.id=poi.variantId JOIN dbo.Products p ON p.id=v.productId
WHERE poi.poId=@PO_Received2 AND p.code='DEMO-APPLE';
SET @GRI_Apple=CONVERT(INT,SCOPE_IDENTITY());
INSERT INTO dbo.Batches(batchCode,variantId,supplierId,goodReceiptItemId,manufactureDate,expirationDate,
initialQuantity,quantity,status,createdAt)
SELECT x.batchCode,v.id,x.supplierId,x.goodReceiptItemId,DATEADD(DAY,x.manufOffset,@Today),
       DATEADD(DAY,x.expOffset,@Today),x.initialQuantity,x.quantity,x.status,
       DATEADD(DAY,-15,CAST(@Today AS DATETIME2(0)))
FROM (VALUES
  ('B-COLA-NEW', 'DEMO-COLA330', N'Lon', @SupplierA, @GRI_Cola, -12, 100, 25, 22, 'ACTIVE'),
  ('B-COLA-FEFO', 'DEMO-COLA330', N'Lon', @SupplierA, @GRI_Cola, -14, 6, 25, 15, 'ACTIVE'),
  ('B-TEA-NEW', 'DEMO-TEA500', N'Chai', @SupplierA, @GRI_Tea, -15, 90, 20, 18, 'ACTIVE'),
  ('B-APPLE-FEFO', 'DEMO-APPLE', N'Kg', @SupplierC, @GRI_Apple, -12, 4, 30, 22, 'ACTIVE'),
  ('B-WATER-BASE', 'DEMO-WATER500', N'Chai', @SupplierA, NULL, -40, 300, 90, 80, 'ACTIVE'),
  ('B-CHIPS-BASE', 'DEMO-CHIPS', N'Gói', @SupplierA, NULL, -30, 180, 40, 37, 'ACTIVE'),
  ('B-COOKIE-BASE', 'DEMO-COOKIE', N'Hộp', @SupplierB, NULL, -20, 150, 35, 31, 'ACTIVE'),
  ('B-MILK-BASE', 'DEMO-MILK1L', N'Hộp', @SupplierB, NULL, -20, 35, 45, 38, 'ACTIVE'),
  ('B-TISSUE-BASE', 'DEMO-TISSUE', N'Gói', @SupplierB, NULL, -70, 500, 30, 25, 'ACTIVE'),
  ('B-RICE-BASE', 'DEMO-RICE', N'Kg', @SupplierC, NULL, -30, 360, 100, 90, 'ACTIVE'),
  ('B-YOGURT-NEAR', 'DEMO-YOGURT', N'Hộp', @SupplierB, NULL, -18, 2, 25, 20, 'ACTIVE'),
  ('B-SOAP-BASE', 'DEMO-SOAP', N'Chai', @SupplierA, NULL, -20, 500, 30, 30, 'ACTIVE'),
  ('B-JUICE-BASE', 'DEMO-JUICE1L', N'Hộp', @SupplierA, NULL, -30, 100, 28, 26, 'ACTIVE'),
  ('B-CHOCO-BASE', 'DEMO-CHOCO', N'Thanh', @SupplierB, NULL, -20, 300, 25, 25, 'ACTIVE'),
  ('B-TEA-EXPIRED', 'DEMO-TEA500', N'Chai', @SupplierA, NULL, -50, -3, 7, 7, 'EXPIRED'),
  ('B-CHIPS-DAMAGED', 'DEMO-CHIPS', N'Gói', @SupplierA, NULL, -60, 150, 4, 4, 'DAMAGED'),
  ('B-TISSUE-RETURN', 'DEMO-TISSUE', N'Gói', @SupplierA, NULL, -60, 300, 5, 0, 'RETURNED'),
  ('B-APPLE-DISPOSED', 'DEMO-APPLE', N'Kg', @SupplierC, NULL, -20, -2, 3, 0, 'DISPOSED'),
  ('B-COLA-LOCPACK', 'DEMO-COLA330', N'Lốc 6', @SupplierA, NULL, -25, 240, 12, 12, 'ACTIVE'),
  ('B-WATER-LOCPACK', 'DEMO-WATER500', N'Lốc 6', @SupplierA, NULL, -25, 240, 10, 10, 'ACTIVE')) x(batchCode,productCode,unitName,supplierId,goodReceiptItemId,manufOffset,expOffset,initialQuantity,quantity,status)
JOIN dbo.Products p ON p.code=x.productCode
JOIN dbo.ProductVariants v ON v.productId=p.id AND v.unitName=x.unitName;
SELECT @BatchCola1=b.id FROM dbo.Batches b WHERE batchCode='B-COLA-NEW';
SELECT @BatchCola2=b.id FROM dbo.Batches b WHERE batchCode='B-COLA-FEFO';
SELECT @BatchChips=b.id FROM dbo.Batches b WHERE batchCode='B-CHIPS-BASE';
SELECT @BatchReturned=b.id FROM dbo.Batches b WHERE batchCode='B-TISSUE-RETURN';
-- Stock on hand equals the total across batch rows; sellable stock must additionally
-- exclude EXPIRED / DAMAGED / RETURNED / DISPOSED batch statuses in application logic.
INSERT INTO dbo.InventoryStocks(variantId,quantityOnHand,minThreshold)
SELECT v.id,ISNULL((SELECT SUM(b.quantity) FROM dbo.Batches b WHERE b.variantId=v.id),0),
       CASE WHEN v.unitType='WEIGHT' THEN 5 WHEN v.conversionFactor>1 THEN 2 ELSE 10 END
FROM dbo.ProductVariants v;
INSERT INTO dbo.InventoryAdjustments(createdBy,reason,status,createdAt,processedBy,processedAt,reviewNote)
VALUES
(@WarehouseA,N'Kiểm kê định kỳ - chờ duyệt','PENDING',DATEADD(MINUTE,540,CAST(@Today AS DATETIME2(0))),NULL,NULL,NULL),
(@WarehouseA,N'Kiểm kê thiếu do hư hỏng','APPROVED',DATEADD(MINUTE,900,CAST(@Yesterday AS DATETIME2(0))),@ManagerId,DATEADD(MINUTE,960,CAST(@Yesterday AS DATETIME2(0))),N'Đã xác minh'),
(@WarehouseB,N'Điều chỉnh không có bằng chứng','REJECTED',DATEADD(MINUTE,840,CAST(@TwoDaysAgo AS DATETIME2(0))),@ManagerId,DATEADD(MINUTE,900,CAST(@TwoDaysAgo AS DATETIME2(0))),N'Không đủ chứng từ');
INSERT INTO dbo.InventoryAdjustmentItems(adjustmentId,variantId,batchId,systemQuantity,actualQuantity)
SELECT a.id,v.id,b.id,x.systemQty,x.actualQty FROM (VALUES
(N'Kiểm kê định kỳ - chờ duyệt','DEMO-WATER500',N'Chai','B-WATER-BASE',80,77),
(N'Kiểm kê thiếu do hư hỏng','DEMO-CHIPS',N'Gói','B-CHIPS-BASE',37,35),
(N'Điều chỉnh không có bằng chứng','DEMO-COOKIE',N'Hộp','B-COOKIE-BASE',31,29)
) x(reason,code,unitName,batchCode,systemQty,actualQty)
JOIN dbo.InventoryAdjustments a ON a.reason=x.reason
JOIN dbo.Products p ON p.code=x.code JOIN dbo.ProductVariants v ON v.productId=p.id AND v.unitName=x.unitName
JOIN dbo.Batches b ON b.variantId=v.id AND b.batchCode=x.batchCode;
INSERT INTO dbo.ProblematicGoodsReport(title,issueDescription,reportedBy,goodReceiptId,batchId,variantId,quantity,status,resolution,resolvedBy,resolvedAt)
SELECT x.title,x.description,@WarehouseA,x.receiptId,b.id,b.variantId,x.qty,x.status,x.resolution,x.resolvedBy,x.resolvedAt
FROM (VALUES
(N'Chai trà bị móp',N'Bao bì có dấu hiệu hư hỏng',@Receipt1,'B-TEA-NEW',2,'Open',NULL,NULL,NULL),
(N'Gói khoai bị vỡ',N'Đã yêu cầu nhà cung cấp đổi hàng',NULL,'B-CHIPS-DAMAGED',4,'Resolved','RETURN_TO_SUPPLIER',@ManagerId,DATEADD(MINUTE,660,CAST(@Yesterday AS DATETIME2(0)))),
(N'Đối chiếu nhầm lô nước',N'Đã xác minh không có sự cố',NULL,'B-WATER-BASE',1,'Rejected','NO_ACTION',@ManagerId,DATEADD(MINUTE,720,CAST(@Yesterday AS DATETIME2(0))))
) x(title,description,receiptId,batchCode,qty,status,resolution,resolvedBy,resolvedAt)
JOIN dbo.Batches b ON b.batchCode=x.batchCode;
INSERT INTO dbo.SupplierReturns(supplierId,createdBy,reason,totalDebtAdjustment,createdAt)
VALUES(@SupplierA,@WarehouseA,N'Trả toàn bộ lô khăn giấy hư hỏng',55000,DATEADD(MINUTE,780,CAST(@Yesterday AS DATETIME2(0))));
DECLARE @SupplierReturnId INT=CONVERT(INT,SCOPE_IDENTITY());
INSERT INTO dbo.SupplierReturnItems(supplierReturnId,batchId,quantity,unitCost)
VALUES(@SupplierReturnId,@BatchReturned,5,11000);
INSERT INTO dbo.Promotions(name,type,value,minInvoiceValue,maxBudget,startDate,endDate,status,createdAt)
VALUES
(N'DEMO - Giảm 10% nước uống','Percent',10,20000,5000000,DATEADD(DAY,-7,CAST(@Today AS DATETIME2(0))),DATEADD(DAY,21,CAST(@Today AS DATETIME2(0))),'Active',DATEADD(DAY,-8,CAST(@Today AS DATETIME2(0)))),
(N'DEMO - Giảm 5.000đ bánh kẹo','Amount',5000,30000,1000000,DATEADD(DAY,-3,CAST(@Today AS DATETIME2(0))),DATEADD(DAY,15,CAST(@Today AS DATETIME2(0))),'Active',DATEADD(DAY,-4,CAST(@Today AS DATETIME2(0)))),
(N'DEMO - Khuyến mãi tuần sau','Percent',15,50000,2000000,DATEADD(DAY,7,CAST(@Today AS DATETIME2(0))),DATEADD(DAY,14,CAST(@Today AS DATETIME2(0))),'Active',CAST(@Today AS DATETIME2(0))),
(N'DEMO - Chiến dịch đã tắt','Percent',20,50000,1000000,DATEADD(DAY,-10,CAST(@Today AS DATETIME2(0))),DATEADD(DAY,10,CAST(@Today AS DATETIME2(0))),'Disabled',DATEADD(DAY,-12,CAST(@Today AS DATETIME2(0)))),
(N'DEMO - Chiến dịch hết hạn','Amount',10000,100000,NULL,DATEADD(DAY,-80,CAST(@Today AS DATETIME2(0))),DATEADD(DAY,-20,CAST(@Today AS DATETIME2(0))),'Expired',DATEADD(DAY,-81,CAST(@Today AS DATETIME2(0)))),
(N'DEMO - Chiến dịch xóa mềm','Percent',5,0,NULL,DATEADD(DAY,-40,CAST(@Today AS DATETIME2(0))),DATEADD(DAY,-10,CAST(@Today AS DATETIME2(0))),'Deleted',DATEADD(DAY,-41,CAST(@Today AS DATETIME2(0)))),
(N'DEMO - Khuyến mãi trùng Cola','Percent',7,20000,1000000,DATEADD(DAY,-1,CAST(@Today AS DATETIME2(0))),DATEADD(DAY,10,CAST(@Today AS DATETIME2(0))),'Active',DATEADD(DAY,-2,CAST(@Today AS DATETIME2(0))));
SELECT @PromoA=id FROM dbo.Promotions WHERE name=N'DEMO - Giảm 10% nước uống';
SELECT @PromoB=id FROM dbo.Promotions WHERE name=N'DEMO - Giảm 5.000đ bánh kẹo';
SELECT @PromoC=id FROM dbo.Promotions WHERE name=N'DEMO - Khuyến mãi tuần sau';
INSERT INTO dbo.PromotionProducts(promotionId,productId,categoryId,variantId)
VALUES
(@PromoA,(SELECT id FROM dbo.Products WHERE code='DEMO-COLA330'),NULL,NULL),
(@PromoA,(SELECT id FROM dbo.Products WHERE code='DEMO-TEA500'),NULL,NULL),
(@PromoB,NULL,(SELECT id FROM dbo.Categories WHERE name=N'Bánh kẹo'),NULL),
((SELECT id FROM dbo.Promotions WHERE name=N'DEMO - Khuyến mãi trùng Cola'),
 (SELECT id FROM dbo.Products WHERE code='DEMO-COLA330'),NULL,NULL),
(@PromoC,(SELECT id FROM dbo.Products WHERE code='DEMO-MILK1L'),NULL,
 (SELECT v.id FROM dbo.ProductVariants v JOIN dbo.Products p ON p.id=v.productId WHERE p.code='DEMO-MILK1L' AND v.unitName=N'Hộp'));
-- 35 extra promotions to test UC52 pagination / filtering (not referenced by invoices)
SET @n=1;
WHILE @n<=35
BEGIN
  INSERT INTO dbo.Promotions(name,type,value,startDate,endDate,status)
  VALUES(N'DEMO PAGE PROMO '+RIGHT('000'+CAST(@n AS VARCHAR(3)),3),'Percent',5,
         DATEADD(DAY,3,CAST(@Today AS DATETIME2(0))),DATEADD(DAY,23,CAST(@Today AS DATETIME2(0))),
         CASE WHEN @n%7=0 THEN 'Disabled' ELSE 'Active' END);
  SET @n=@n+1;
END;
INSERT INTO dbo.Vouchers(code,value,type,minOrderValue,maxUsage,currentUsage,startDate,expiryDate,status)
VALUES
('DEMO5K',3000,'Fixed',20000,100,1,DATEADD(DAY,-5,CAST(@Today AS DATETIME2(0))),DATEADD(DAY,25,CAST(@Today AS DATETIME2(0))),'Active'),
('DEMO2K',2000,'Fixed',20000,100,1,DATEADD(DAY,-5,CAST(@Today AS DATETIME2(0))),DATEADD(DAY,25,CAST(@Today AS DATETIME2(0))),'Active'),
('DEMOPERCENT10',10,'Percent',30000,100,0,DATEADD(DAY,-5,CAST(@Today AS DATETIME2(0))),DATEADD(DAY,25,CAST(@Today AS DATETIME2(0))),'Active'),
('DEMOUSEDUP',5000,'Fixed',20000,1,1,DATEADD(DAY,-30,CAST(@Today AS DATETIME2(0))),DATEADD(DAY,5,CAST(@Today AS DATETIME2(0))),'Active'),
('DEMODISABLED',10000,'Fixed',30000,10,0,DATEADD(DAY,-5,CAST(@Today AS DATETIME2(0))),DATEADD(DAY,25,CAST(@Today AS DATETIME2(0))),'Disabled'),
('DEMOEXPIRED',15,'Percent',50000,10,0,DATEADD(DAY,-100,CAST(@Today AS DATETIME2(0))),DATEADD(DAY,-3,CAST(@Today AS DATETIME2(0))),'Expired'),
('DEMODELETED',5,'Percent',50000,10,0,DATEADD(DAY,-50,CAST(@Today AS DATETIME2(0))),DATEADD(DAY,-5,CAST(@Today AS DATETIME2(0))),'Deleted');
SELECT @VoucherA=id FROM dbo.Vouchers WHERE code='DEMO5K';
SELECT @VoucherB=id FROM dbo.Vouchers WHERE code='DEMO2K';
-- 34 extra vouchers for UC57 pagination
SET @n=1;
WHILE @n<=34
BEGIN
  INSERT INTO dbo.Vouchers(code,value,type,minOrderValue,maxUsage,startDate,expiryDate,status)
  VALUES('DEMOPAGE'+RIGHT('000'+CAST(@n AS VARCHAR(3)),3),5000,'Fixed',30000,30,
         DATEADD(DAY,-2,CAST(@Today AS DATETIME2(0))),DATEADD(DAY,30,CAST(@Today AS DATETIME2(0))),
         CASE WHEN @n%9=0 THEN 'Disabled' ELSE 'Active' END);
  SET @n=@n+1;
END;
INSERT INTO dbo.Invoices(invoiceCode,staffId,counterId,scheduleId,customerId,totalAmount,promotionId,
  promotionDiscount,voucherDiscount,usedPoints,pointDiscount,finalAmount,status,isOnHold,heldAt,createdAt)
VALUES('DEMO-INV-0001',@CashA,@Counter1,@WSA_Y,@CustA,40000.00,@PromoA,4000,0,0,0,36000.00,'PAID',0,
 NULL,DATEADD(MINUTE,600,CAST(@Yesterday AS DATETIME2(0))));
SET @Inv1=CONVERT(BIGINT,SCOPE_IDENTITY());
INSERT INTO dbo.InvoiceItems(invoiceId,productId,variantId,batchId,productName,unitName,unitPrice,quantity,lineTotal,baseQuantity)
SELECT @Inv1,p.id,v.id,b.id,p.name,v.unitName,12000,2,24000.00,2*v.conversionFactor
FROM dbo.Products p JOIN dbo.ProductVariants v ON v.productId=p.id AND v.unitName=N'Lon'
JOIN dbo.Batches b ON b.variantId=v.id AND b.batchCode='B-COLA-FEFO'
WHERE p.code='DEMO-COLA330';
INSERT INTO dbo.InvoiceItems(invoiceId,productId,variantId,batchId,productName,unitName,unitPrice,quantity,lineTotal,baseQuantity)
SELECT @Inv1,p.id,v.id,b.id,p.name,v.unitName,16000,1,16000.00,1*v.conversionFactor
FROM dbo.Products p JOIN dbo.ProductVariants v ON v.productId=p.id AND v.unitName=N'Gói'
JOIN dbo.Batches b ON b.variantId=v.id AND b.batchCode='B-CHIPS-BASE'
WHERE p.code='DEMO-CHIPS';
INSERT INTO dbo.Payments(invoiceId,paymentMethod,amount,receivedAmount,status,createdAt)
VALUES(@Inv1,'CASH',36000.00,50000,'SUCCESS',DATEADD(MINUTE,600,CAST(@Yesterday AS DATETIME2(0))));

INSERT INTO dbo.Invoices(invoiceCode,staffId,counterId,scheduleId,customerId,totalAmount,promotionId,
  promotionDiscount,voucherDiscount,usedPoints,pointDiscount,finalAmount,status,isOnHold,heldAt,createdAt)
VALUES('DEMO-INV-0002',@CashA,@Counter1,@WSA_Y,@CustA,50000.00,NULL,0,5000,0,0,45000.00,'PAID',0,
 NULL,DATEADD(MINUTE,660,CAST(@Yesterday AS DATETIME2(0))));
SET @Inv2=CONVERT(BIGINT,SCOPE_IDENTITY());
INSERT INTO dbo.InvoiceItems(invoiceId,productId,variantId,batchId,productName,unitName,unitPrice,quantity,lineTotal,baseQuantity)
SELECT @Inv2,p.id,v.id,b.id,p.name,v.unitName,18000,1,18000.00,1*v.conversionFactor
FROM dbo.Products p JOIN dbo.ProductVariants v ON v.productId=p.id AND v.unitName=N'Chai'
JOIN dbo.Batches b ON b.variantId=v.id AND b.batchCode='B-TEA-NEW'
WHERE p.code='DEMO-TEA500';
INSERT INTO dbo.InvoiceItems(invoiceId,productId,variantId,batchId,productName,unitName,unitPrice,quantity,lineTotal,baseQuantity)
SELECT @Inv2,p.id,v.id,b.id,p.name,v.unitName,32000,1,32000.00,1*v.conversionFactor
FROM dbo.Products p JOIN dbo.ProductVariants v ON v.productId=p.id AND v.unitName=N'Hộp'
JOIN dbo.Batches b ON b.variantId=v.id AND b.batchCode='B-MILK-BASE'
WHERE p.code='DEMO-MILK1L';
INSERT INTO dbo.Payments(invoiceId,paymentMethod,amount,receivedAmount,status,createdAt)
VALUES(@Inv2,'BANK_TRANSFER',45000.00,NULL,'SUCCESS',DATEADD(MINUTE,660,CAST(@Yesterday AS DATETIME2(0))));
INSERT INTO dbo.SepayTransactions(invoiceId,sepayId,transactionContent,amountIn,bankAccountNumber,qrUrl,expiresAt,status,createdAt,confirmAt)
VALUES(@Inv2,'DEMO-SP-00002',N'DEMO DEMO-INV-0002',45000.00,'0000000000',N'https://example.invalid/retailone/qr/DEMO-INV-0002',
 DATEADD(MINUTE,720,CAST(@Yesterday AS DATETIME2(0))),'SUCCESS',DATEADD(MINUTE,660,CAST(@Yesterday AS DATETIME2(0))),DATEADD(MINUTE,660,CAST(@Yesterday AS DATETIME2(0))));

INSERT INTO dbo.Invoices(invoiceCode,staffId,counterId,scheduleId,customerId,totalAmount,promotionId,
  promotionDiscount,voucherDiscount,usedPoints,pointDiscount,finalAmount,status,isOnHold,heldAt,createdAt)
VALUES('DEMO-INV-0003',@CashA,@Counter1,@WSA_Y,@CustB,38000.00,NULL,0,0,0,0,38000.00,'PAID',0,
 NULL,DATEADD(MINUTE,780,CAST(@Yesterday AS DATETIME2(0))));
SET @Inv3=CONVERT(BIGINT,SCOPE_IDENTITY());
INSERT INTO dbo.InvoiceItems(invoiceId,productId,variantId,batchId,productName,unitName,unitPrice,quantity,lineTotal,baseQuantity)
SELECT @Inv3,p.id,v.id,b.id,p.name,v.unitName,22000,1,22000.00,1*v.conversionFactor
FROM dbo.Products p JOIN dbo.ProductVariants v ON v.productId=p.id AND v.unitName=N'Gói'
JOIN dbo.Batches b ON b.variantId=v.id AND b.batchCode='B-TISSUE-BASE'
WHERE p.code='DEMO-TISSUE';
INSERT INTO dbo.InvoiceItems(invoiceId,productId,variantId,batchId,productName,unitName,unitPrice,quantity,lineTotal,baseQuantity)
SELECT @Inv3,p.id,v.id,b.id,p.name,v.unitName,8000,2,16000.00,2*v.conversionFactor
FROM dbo.Products p JOIN dbo.ProductVariants v ON v.productId=p.id AND v.unitName=N'Chai'
JOIN dbo.Batches b ON b.variantId=v.id AND b.batchCode='B-WATER-BASE'
WHERE p.code='DEMO-WATER500';
INSERT INTO dbo.Payments(invoiceId,paymentMethod,amount,receivedAmount,status,createdAt)
VALUES(@Inv3,'CASH',38000.00,50000,'SUCCESS',DATEADD(MINUTE,780,CAST(@Yesterday AS DATETIME2(0))));

INSERT INTO dbo.Invoices(invoiceCode,staffId,counterId,scheduleId,customerId,totalAmount,promotionId,
  promotionDiscount,voucherDiscount,usedPoints,pointDiscount,finalAmount,status,isOnHold,heldAt,createdAt)
VALUES('DEMO-INV-0004',@CashB,@Counter2,@WSB_Y,@CustC,60000.00,NULL,0,0,0,0,60000.00,'PAID',0,
 NULL,DATEADD(MINUTE,660,CAST(@Yesterday AS DATETIME2(0))));
SET @Inv4=CONVERT(BIGINT,SCOPE_IDENTITY());
INSERT INTO dbo.InvoiceItems(invoiceId,productId,variantId,batchId,productName,unitName,unitPrice,quantity,lineTotal,baseQuantity)
SELECT @Inv4,p.id,v.id,b.id,p.name,v.unitName,35000,1,35000.00,1*v.conversionFactor
FROM dbo.Products p JOIN dbo.ProductVariants v ON v.productId=p.id AND v.unitName=N'Hộp'
JOIN dbo.Batches b ON b.variantId=v.id AND b.batchCode='B-JUICE-BASE'
WHERE p.code='DEMO-JUICE1L';
INSERT INTO dbo.InvoiceItems(invoiceId,productId,variantId,batchId,productName,unitName,unitPrice,quantity,lineTotal,baseQuantity)
SELECT @Inv4,p.id,v.id,b.id,p.name,v.unitName,25000,1,25000.00,1*v.conversionFactor
FROM dbo.Products p JOIN dbo.ProductVariants v ON v.productId=p.id AND v.unitName=N'Hộp'
JOIN dbo.Batches b ON b.variantId=v.id AND b.batchCode='B-COOKIE-BASE'
WHERE p.code='DEMO-COOKIE';
INSERT INTO dbo.Payments(invoiceId,paymentMethod,amount,receivedAmount,status,createdAt)
VALUES(@Inv4,'CASH',60000.00,100000,'SUCCESS',DATEADD(MINUTE,660,CAST(@Yesterday AS DATETIME2(0))));

INSERT INTO dbo.Invoices(invoiceCode,staffId,counterId,scheduleId,customerId,totalAmount,promotionId,
  promotionDiscount,voucherDiscount,usedPoints,pointDiscount,finalAmount,status,isOnHold,heldAt,createdAt)
VALUES('DEMO-INV-0005',@CashA,@Counter1,@WSA_D2,@CustB,32000.00,NULL,0,0,0,0,32000.00,'PAID',0,
 NULL,DATEADD(MINUTE,720,CAST(@TwoDaysAgo AS DATETIME2(0))));
SET @Inv5=CONVERT(BIGINT,SCOPE_IDENTITY());
INSERT INTO dbo.InvoiceItems(invoiceId,productId,variantId,batchId,productName,unitName,unitPrice,quantity,lineTotal,baseQuantity)
SELECT @Inv5,p.id,v.id,b.id,p.name,v.unitName,16000,2,32000.00,2*v.conversionFactor
FROM dbo.Products p JOIN dbo.ProductVariants v ON v.productId=p.id AND v.unitName=N'Gói'
JOIN dbo.Batches b ON b.variantId=v.id AND b.batchCode='B-CHIPS-BASE'
WHERE p.code='DEMO-CHIPS';
INSERT INTO dbo.Payments(invoiceId,paymentMethod,amount,receivedAmount,status,createdAt)
VALUES(@Inv5,'CASH',32000.00,50000,'SUCCESS',DATEADD(MINUTE,720,CAST(@TwoDaysAgo AS DATETIME2(0))));

INSERT INTO dbo.Invoices(invoiceCode,staffId,counterId,scheduleId,customerId,totalAmount,promotionId,
  promotionDiscount,voucherDiscount,usedPoints,pointDiscount,finalAmount,status,isOnHold,heldAt,createdAt)
VALUES('DEMO-INV-0006',@CashA,@Counter1,@WSA_D2,@CustA,50000.00,NULL,0,5000,0,0,45000.00,'PAID',0,
 NULL,DATEADD(MINUTE,840,CAST(@TwoDaysAgo AS DATETIME2(0))));
SET @Inv6=CONVERT(BIGINT,SCOPE_IDENTITY());
INSERT INTO dbo.InvoiceItems(invoiceId,productId,variantId,batchId,productName,unitName,unitPrice,quantity,lineTotal,baseQuantity)
SELECT @Inv6,p.id,v.id,b.id,p.name,v.unitName,25000,2,50000.00,2*v.conversionFactor
FROM dbo.Products p JOIN dbo.ProductVariants v ON v.productId=p.id AND v.unitName=N'Kg'
JOIN dbo.Batches b ON b.variantId=v.id AND b.batchCode='B-RICE-BASE'
WHERE p.code='DEMO-RICE';
INSERT INTO dbo.Payments(invoiceId,paymentMethod,amount,receivedAmount,status,createdAt)
VALUES(@Inv6,'BANK_TRANSFER',45000.00,NULL,'SUCCESS',DATEADD(MINUTE,840,CAST(@TwoDaysAgo AS DATETIME2(0))));
INSERT INTO dbo.SepayTransactions(invoiceId,sepayId,transactionContent,amountIn,bankAccountNumber,qrUrl,expiresAt,status,createdAt,confirmAt)
VALUES(@Inv6,'DEMO-SP-00006',N'DEMO DEMO-INV-0006',45000.00,'0000000000',N'https://example.invalid/retailone/qr/DEMO-INV-0006',
 DATEADD(MINUTE,900,CAST(@TwoDaysAgo AS DATETIME2(0))),'SUCCESS',DATEADD(MINUTE,840,CAST(@TwoDaysAgo AS DATETIME2(0))),DATEADD(MINUTE,840,CAST(@TwoDaysAgo AS DATETIME2(0))));

INSERT INTO dbo.Invoices(invoiceCode,staffId,counterId,scheduleId,customerId,totalAmount,promotionId,
  promotionDiscount,voucherDiscount,usedPoints,pointDiscount,finalAmount,status,isOnHold,heldAt,createdAt)
VALUES('DEMO-INV-0007',@CashA,@Counter1,@WSA_Today,@CustB,36000.00,NULL,0,0,0,0,36000.00,'UNPAID',1,
 DATEADD(MINUTE,600,CAST(@Today AS DATETIME2(0))),DATEADD(MINUTE,600,CAST(@Today AS DATETIME2(0))));
SET @Inv7=CONVERT(BIGINT,SCOPE_IDENTITY());
INSERT INTO dbo.InvoiceItems(invoiceId,productId,variantId,batchId,productName,unitName,unitPrice,quantity,lineTotal,baseQuantity)
SELECT @Inv7,p.id,v.id,b.id,p.name,v.unitName,12000,3,36000.00,3*v.conversionFactor
FROM dbo.Products p JOIN dbo.ProductVariants v ON v.productId=p.id AND v.unitName=N'Lon'
JOIN dbo.Batches b ON b.variantId=v.id AND b.batchCode='B-COLA-NEW'
WHERE p.code='DEMO-COLA330';
INSERT INTO dbo.Payments(invoiceId,paymentMethod,amount,receivedAmount,status,createdAt)
VALUES(@Inv7,'BANK_TRANSFER',36000.00,NULL,'PENDING',DATEADD(MINUTE,600,CAST(@Today AS DATETIME2(0))));
INSERT INTO dbo.SepayTransactions(invoiceId,sepayId,transactionContent,amountIn,bankAccountNumber,qrUrl,expiresAt,status,createdAt,confirmAt)
VALUES(@Inv7,NULL,N'DEMO DEMO-INV-0007',36000.00,'0000000000',N'https://example.invalid/retailone/qr/DEMO-INV-0007',
 DATEADD(MINUTE,660,CAST(@Today AS DATETIME2(0))),'PENDING',DATEADD(MINUTE,600,CAST(@Today AS DATETIME2(0))),NULL);

INSERT INTO dbo.Invoices(invoiceCode,staffId,counterId,scheduleId,customerId,totalAmount,promotionId,
  promotionDiscount,voucherDiscount,usedPoints,pointDiscount,finalAmount,status,isOnHold,heldAt,createdAt)
VALUES('DEMO-INV-0008',@CashA,@Counter1,@WSA_Today,NULL,25000.00,NULL,0,0,0,0,25000.00,'UNPAID',0,
 NULL,DATEADD(MINUTE,660,CAST(@Today AS DATETIME2(0))));
SET @Inv8=CONVERT(BIGINT,SCOPE_IDENTITY());
INSERT INTO dbo.InvoiceItems(invoiceId,productId,variantId,batchId,productName,unitName,unitPrice,quantity,lineTotal,baseQuantity)
SELECT @Inv8,p.id,v.id,b.id,p.name,v.unitName,25000,1,25000.00,1*v.conversionFactor
FROM dbo.Products p JOIN dbo.ProductVariants v ON v.productId=p.id AND v.unitName=N'Hộp'
JOIN dbo.Batches b ON b.variantId=v.id AND b.batchCode='B-COOKIE-BASE'
WHERE p.code='DEMO-COOKIE';

INSERT INTO dbo.Invoices(invoiceCode,staffId,counterId,scheduleId,customerId,totalAmount,promotionId,
  promotionDiscount,voucherDiscount,usedPoints,pointDiscount,finalAmount,status,isOnHold,heldAt,createdAt)
VALUES('DEMO-INV-0009',@CashA,@Counter1,@WSA_Y,NULL,8000.00,NULL,0,0,0,0,8000.00,'CANCELLED',0,
 NULL,DATEADD(MINUTE,720,CAST(@Yesterday AS DATETIME2(0))));
SET @Inv9=CONVERT(BIGINT,SCOPE_IDENTITY());
INSERT INTO dbo.InvoiceItems(invoiceId,productId,variantId,batchId,productName,unitName,unitPrice,quantity,lineTotal,baseQuantity)
SELECT @Inv9,p.id,v.id,b.id,p.name,v.unitName,8000,1,8000.00,1*v.conversionFactor
FROM dbo.Products p JOIN dbo.ProductVariants v ON v.productId=p.id AND v.unitName=N'Chai'
JOIN dbo.Batches b ON b.variantId=v.id AND b.batchCode='B-WATER-BASE'
WHERE p.code='DEMO-WATER500';
INSERT INTO dbo.Payments(invoiceId,paymentMethod,amount,receivedAmount,status,createdAt)
VALUES(@Inv9,'BANK_TRANSFER',8000.00,NULL,'FAILED',DATEADD(MINUTE,720,CAST(@Yesterday AS DATETIME2(0))));
INSERT INTO dbo.SepayTransactions(invoiceId,sepayId,transactionContent,amountIn,bankAccountNumber,qrUrl,expiresAt,status,createdAt,confirmAt)
VALUES(@Inv9,NULL,N'DEMO DEMO-INV-0009',8000.00,'0000000000',N'https://example.invalid/retailone/qr/DEMO-INV-0009',
 DATEADD(MINUTE,780,CAST(@Yesterday AS DATETIME2(0))),'FAILED',DATEADD(MINUTE,720,CAST(@Yesterday AS DATETIME2(0))),NULL);

INSERT INTO dbo.Invoices(invoiceCode,staffId,counterId,scheduleId,customerId,totalAmount,promotionId,
  promotionDiscount,voucherDiscount,usedPoints,pointDiscount,finalAmount,status,isOnHold,heldAt,createdAt)
VALUES('DEMO-INV-0010',@CashA,@Counter1,@WSA_D2,@CustC,50000.00,NULL,0,0,0,0,50000.00,'PARTIALLY_REFUNDED',0,
 NULL,DATEADD(MINUTE,900,CAST(@TwoDaysAgo AS DATETIME2(0))));
SET @Inv10=CONVERT(BIGINT,SCOPE_IDENTITY());
INSERT INTO dbo.InvoiceItems(invoiceId,productId,variantId,batchId,productName,unitName,unitPrice,quantity,lineTotal,baseQuantity)
SELECT @Inv10,p.id,v.id,b.id,p.name,v.unitName,25000,2,50000.00,2*v.conversionFactor
FROM dbo.Products p JOIN dbo.ProductVariants v ON v.productId=p.id AND v.unitName=N'Hộp'
JOIN dbo.Batches b ON b.variantId=v.id AND b.batchCode='B-COOKIE-BASE'
WHERE p.code='DEMO-COOKIE';
INSERT INTO dbo.Payments(invoiceId,paymentMethod,amount,receivedAmount,status,createdAt)
VALUES(@Inv10,'CASH',50000.00,100000,'SUCCESS',DATEADD(MINUTE,900,CAST(@TwoDaysAgo AS DATETIME2(0))));

INSERT INTO dbo.Invoices(invoiceCode,staffId,counterId,scheduleId,customerId,totalAmount,promotionId,
  promotionDiscount,voucherDiscount,usedPoints,pointDiscount,finalAmount,status,isOnHold,heldAt,createdAt)
VALUES('DEMO-INV-0011',@CashB,@Counter2,NULL,@CustD,22000.00,NULL,0,0,0,0,22000.00,'REFUNDED',0,
 NULL,DATEADD(MINUTE,960,CAST(@TwoDaysAgo AS DATETIME2(0))));
SET @Inv11=CONVERT(BIGINT,SCOPE_IDENTITY());
INSERT INTO dbo.InvoiceItems(invoiceId,productId,variantId,batchId,productName,unitName,unitPrice,quantity,lineTotal,baseQuantity)
SELECT @Inv11,p.id,v.id,b.id,p.name,v.unitName,22000,1,22000.00,1*v.conversionFactor
FROM dbo.Products p JOIN dbo.ProductVariants v ON v.productId=p.id AND v.unitName=N'Gói'
JOIN dbo.Batches b ON b.variantId=v.id AND b.batchCode='B-TISSUE-BASE'
WHERE p.code='DEMO-TISSUE';
INSERT INTO dbo.Payments(invoiceId,paymentMethod,amount,receivedAmount,status,createdAt)
VALUES(@Inv11,'CASH',22000.00,30000,'SUCCESS',DATEADD(MINUTE,960,CAST(@TwoDaysAgo AS DATETIME2(0))));

INSERT INTO dbo.Invoices(invoiceCode,staffId,counterId,scheduleId,customerId,totalAmount,promotionId,
  promotionDiscount,voucherDiscount,usedPoints,pointDiscount,finalAmount,status,isOnHold,heldAt,createdAt)
VALUES('DEMO-INV-0012',@CashA,@Counter1,@WSA_Today,@CustD,18000.00,NULL,0,0,0,0,18000.00,'PAID',0,
 NULL,DATEADD(MINUTE,720,CAST(@Today AS DATETIME2(0))));
SET @Inv12=CONVERT(BIGINT,SCOPE_IDENTITY());
INSERT INTO dbo.InvoiceItems(invoiceId,productId,variantId,batchId,productName,unitName,unitPrice,quantity,lineTotal,baseQuantity)
SELECT @Inv12,p.id,v.id,b.id,p.name,v.unitName,18000,1,18000.00,1*v.conversionFactor
FROM dbo.Products p JOIN dbo.ProductVariants v ON v.productId=p.id AND v.unitName=N'Chai'
JOIN dbo.Batches b ON b.variantId=v.id AND b.batchCode='B-TEA-NEW'
WHERE p.code='DEMO-TEA500';
INSERT INTO dbo.Payments(invoiceId,paymentMethod,amount,receivedAmount,status,createdAt)
VALUES(@Inv12,'BANK_TRANSFER',18000.00,NULL,'SUCCESS',DATEADD(MINUTE,720,CAST(@Today AS DATETIME2(0))));
INSERT INTO dbo.SepayTransactions(invoiceId,sepayId,transactionContent,amountIn,bankAccountNumber,qrUrl,expiresAt,status,createdAt,confirmAt)
VALUES(@Inv12,'DEMO-SP-00012',N'DEMO DEMO-INV-0012',18000.00,'0000000000',N'https://example.invalid/retailone/qr/DEMO-INV-0012',
 DATEADD(MINUTE,780,CAST(@Today AS DATETIME2(0))),'SUCCESS',DATEADD(MINUTE,720,CAST(@Today AS DATETIME2(0))),DATEADD(MINUTE,720,CAST(@Today AS DATETIME2(0))));

INSERT INTO dbo.Invoices(invoiceCode,staffId,counterId,scheduleId,customerId,totalAmount,promotionId,
  promotionDiscount,voucherDiscount,usedPoints,pointDiscount,finalAmount,status,isOnHold,heldAt,createdAt)
VALUES('DEMO-INV-0013',@CashA,@Counter1,@WSA_Today,NULL,32000.00,NULL,0,0,0,0,32000.00,'UNPAID',0,
 NULL,DATEADD(MINUTE,780,CAST(@Today AS DATETIME2(0))));
SET @Inv13=CONVERT(BIGINT,SCOPE_IDENTITY());
INSERT INTO dbo.InvoiceItems(invoiceId,productId,variantId,batchId,productName,unitName,unitPrice,quantity,lineTotal,baseQuantity)
SELECT @Inv13,p.id,v.id,b.id,p.name,v.unitName,32000,1,32000.00,1*v.conversionFactor
FROM dbo.Products p JOIN dbo.ProductVariants v ON v.productId=p.id AND v.unitName=N'Hộp'
JOIN dbo.Batches b ON b.variantId=v.id AND b.batchCode='B-MILK-BASE'
WHERE p.code='DEMO-MILK1L';
INSERT INTO dbo.Payments(invoiceId,paymentMethod,amount,receivedAmount,status,createdAt)
VALUES(@Inv13,'BANK_TRANSFER',32000.00,NULL,'PENDING',DATEADD(MINUTE,780,CAST(@Today AS DATETIME2(0))));
INSERT INTO dbo.SepayTransactions(invoiceId,sepayId,transactionContent,amountIn,bankAccountNumber,qrUrl,expiresAt,status,createdAt,confirmAt)
VALUES(@Inv13,NULL,N'DEMO DEMO-INV-0013',32000.00,'0000000000',N'https://example.invalid/retailone/qr/DEMO-INV-0013',
 DATEADD(MINUTE,840,CAST(@Today AS DATETIME2(0))),'PENDING',DATEADD(MINUTE,780,CAST(@Today AS DATETIME2(0))),NULL);

INSERT INTO dbo.Invoices(invoiceCode,staffId,counterId,scheduleId,customerId,totalAmount,promotionId,
  promotionDiscount,voucherDiscount,usedPoints,pointDiscount,finalAmount,status,isOnHold,heldAt,createdAt)
VALUES('DEMO-INV-0014',@CashB,@Counter2,@WSB_Y,@CustB,50000.00,NULL,0,0,0,0,50000.00,'PAID',0,
 NULL,DATEADD(MINUTE,900,CAST(@Yesterday AS DATETIME2(0))));
SET @Inv14=CONVERT(BIGINT,SCOPE_IDENTITY());
INSERT INTO dbo.InvoiceItems(invoiceId,productId,variantId,batchId,productName,unitName,unitPrice,quantity,lineTotal,baseQuantity)
SELECT @Inv14,p.id,v.id,b.id,p.name,v.unitName,25000,2,50000.00,2*v.conversionFactor
FROM dbo.Products p JOIN dbo.ProductVariants v ON v.productId=p.id AND v.unitName=N'Kg'
JOIN dbo.Batches b ON b.variantId=v.id AND b.batchCode='B-RICE-BASE'
WHERE p.code='DEMO-RICE';
INSERT INTO dbo.Payments(invoiceId,paymentMethod,amount,receivedAmount,status,createdAt)
VALUES(@Inv14,'BANK_TRANSFER',50000.00,NULL,'SUCCESS',DATEADD(MINUTE,900,CAST(@Yesterday AS DATETIME2(0))));
INSERT INTO dbo.SepayTransactions(invoiceId,sepayId,transactionContent,amountIn,bankAccountNumber,qrUrl,expiresAt,status,createdAt,confirmAt)
VALUES(@Inv14,'DEMO-SP-00014',N'DEMO DEMO-INV-0014',50000.00,'0000000000',N'https://example.invalid/retailone/qr/DEMO-INV-0014',
 DATEADD(MINUTE,960,CAST(@Yesterday AS DATETIME2(0))),'SUCCESS',DATEADD(MINUTE,900,CAST(@Yesterday AS DATETIME2(0))),DATEADD(MINUTE,900,CAST(@Yesterday AS DATETIME2(0))));

-- Additional historical PAID invoices (no scheduleId) for invoice pagination.
-- These do NOT change cashier handover totals of the four demo shifts.
SET @n=1;
WHILE @n<=42
BEGIN
  INSERT INTO dbo.Invoices(invoiceCode,staffId,counterId,scheduleId,customerId,totalAmount,finalAmount,status,createdAt)
  VALUES('DEMO-PAGE-'+RIGHT('0000'+CAST(@n AS VARCHAR(4)),4),@CashA,@Counter1,NULL,NULL,12000,12000,
         'PAID',DATEADD(DAY,-(@n+5),CAST(@Today AS DATETIME2(0))));
  DECLARE @ExtraInvoiceId BIGINT=CONVERT(BIGINT,SCOPE_IDENTITY());
  INSERT INTO dbo.InvoiceItems(invoiceId,productId,variantId,batchId,productName,unitName,unitPrice,quantity,lineTotal,baseQuantity)
  SELECT @ExtraInvoiceId,p.id,v.id,NULL,p.name,v.unitName,12000,1,12000,1
  FROM dbo.Products p JOIN dbo.ProductVariants v ON v.productId=p.id
  WHERE p.code='DEMO-COLA330' AND v.unitName=N'Lon';
  INSERT INTO dbo.Payments(invoiceId,paymentMethod,amount,receivedAmount,status)
  VALUES(@ExtraInvoiceId,'CASH',12000,20000,'SUCCESS');
  SET @n=@n+1;
END;
-- BR08 expected cash = openingCash + successful CASH payments within the shift.
-- No cash-payout table exists in this schema; demo has zero cash payouts.
-- Balanced, Pending variance and Reviewed variance scenarios.
DECLARE @ExpectedCash DECIMAL(15,2), @CollectedCash DECIMAL(15,2);
SELECT @CollectedCash=ISNULL(SUM(pm.amount),0) FROM dbo.Invoices i
JOIN dbo.Payments pm ON pm.invoiceId=i.id
WHERE i.scheduleId=@WSA_Y AND pm.paymentMethod='CASH' AND pm.status='SUCCESS';
SELECT @ExpectedCash=ws.openingCash+@CollectedCash FROM dbo.WorkSchedules ws WHERE ws.id=@WSA_Y;
INSERT INTO dbo.CashHandovers(scheduleId,handoverTime,openingCash,systemCash,actualCash,note,reviewStatus,reviewedBy,reviewedAt,reviewNote)
VALUES(@WSA_Y,DATEADD(MINUTE,967,CAST(@Yesterday AS DATETIME2(0))),500000,@CollectedCash,@ExpectedCash,NULL,'Reviewed',@ManagerId,DATEADD(MINUTE,1080,CAST(@Yesterday AS DATETIME2(0))),N'Khớp tiền');

SELECT @CollectedCash=ISNULL(SUM(pm.amount),0) FROM dbo.Invoices i JOIN dbo.Payments pm ON pm.invoiceId=i.id
WHERE i.scheduleId=@WSB_Y AND pm.paymentMethod='CASH' AND pm.status='SUCCESS';
SELECT @ExpectedCash=ws.openingCash+@CollectedCash FROM dbo.WorkSchedules ws WHERE ws.id=@WSB_Y;
INSERT INTO dbo.CashHandovers(scheduleId,handoverTime,openingCash,systemCash,actualCash,note,reviewStatus)
VALUES(@WSB_Y,DATEADD(MINUTE,968,CAST(@Yesterday AS DATETIME2(0))),300000,@CollectedCash,@ExpectedCash-5000,N'Thiếu 5.000đ - chờ Manager duyệt','Pending');

SELECT @CollectedCash=ISNULL(SUM(pm.amount),0) FROM dbo.Invoices i JOIN dbo.Payments pm ON pm.invoiceId=i.id
WHERE i.scheduleId=@WSA_D2 AND pm.paymentMethod='CASH' AND pm.status='SUCCESS';
SELECT @ExpectedCash=ws.openingCash+@CollectedCash FROM dbo.WorkSchedules ws WHERE ws.id=@WSA_D2;
INSERT INTO dbo.CashHandovers(scheduleId,handoverTime,openingCash,systemCash,actualCash,note,reviewStatus,reviewedBy,reviewedAt,reviewNote)
VALUES(@WSA_D2,DATEADD(MINUTE,970,CAST(@TwoDaysAgo AS DATETIME2(0))),450000,@CollectedCash,@ExpectedCash+5000,N'Thừa 5.000đ',
 'Reviewed',@ManagerId,DATEADD(MINUTE,540,CAST(@Yesterday AS DATETIME2(0))),N'Đã xác minh và chấp nhận chênh lệch');
INSERT INTO dbo.Payrolls(staffId,month,year,appliedBaseSalary,appliedSalaryType,totalWorkUnit,
provisionalSalary,deductions,finalAmount,note,status,createdAt)
VALUES
(@CashA,MONTH(@Yesterday),YEAR(@Yesterday),30000,'hourly',16.06,481800,0,481800,N'Dữ liệu lương demo theo chấm công','draft',CAST(@Today AS DATETIME2(0))),
(@CashB,MONTH(@Yesterday),YEAR(@Yesterday),28000,'hourly',7.62,213360,10000,203360,N'Đi trễ trừ 10.000đ','draft',CAST(@Today AS DATETIME2(0))),
(@WarehouseA,MONTH(@Yesterday),YEAR(@Yesterday),32000,'hourly',7.97,255040,0,255040,N'Demo lương nhân viên kho','paid',CAST(@Today AS DATETIME2(0))),
(@ManagerId,MONTH(@Yesterday),YEAR(@Yesterday),18000000,'monthly',1,18000000,0,18000000,N'Lương quản lý demo','draft',CAST(@Today AS DATETIME2(0)));
INSERT INTO dbo.CustomerVoucherUsage(customerId,voucherId,invoiceId,usedAt)
VALUES(@CustA,@VoucherA,@Inv2,DATEADD(MINUTE,660,CAST(@Yesterday AS DATETIME2(0)))),(@CustA,@VoucherB,@Inv2,DATEADD(MINUTE,660,CAST(@Yesterday AS DATETIME2(0))));
INSERT INTO dbo.CustomerPointLogs(customerId,invoiceId,pointChange,reason,createdAt)
VALUES
(@CustA,@Inv1,120,N'Tích điểm hóa đơn đã thanh toán',DATEADD(MINUTE,600,CAST(@Yesterday AS DATETIME2(0)))),
(@CustA,@Inv2,-20,N'Sử dụng điểm thử nghiệm trước kỳ',DATEADD(MINUTE,660,CAST(@Yesterday AS DATETIME2(0)))),
(@CustB,@Inv3,40,N'Tích điểm theo hóa đơn',DATEADD(MINUTE,780,CAST(@Yesterday AS DATETIME2(0)))),
(@CustC,@Inv4,20,N'Tích điểm theo hóa đơn',DATEADD(MINUTE,660,CAST(@Yesterday AS DATETIME2(0))));
-- Illustrative balances aligned to the ledger entries above (no opening-point events).
UPDATE dbo.Customers SET loyaltyPoints=CASE WHEN id=@CustA THEN 100 WHEN id=@CustB THEN 40 WHEN id=@CustC THEN 20 ELSE loyaltyPoints END,
    totalSpending=ISNULL((SELECT SUM(i.finalAmount) FROM dbo.Invoices i
       WHERE i.customerId=dbo.Customers.id AND i.status IN ('PAID','PARTIALLY_REFUNDED')),0),
    updatedAt=SYSDATETIME()
WHERE phone LIKE '0920001%';
INSERT INTO dbo.Returns(invoiceId,exchangeInvoiceId,counterId,staffId,returnType,refundMethod,
 totalRefundAmount,reason,status,approveBy,approvedAt,reviewNote)
VALUES
(@Inv10,NULL,@Counter1,@CashA,'REFUND','CASH',25000,N'Hoàn một hộp bánh','Approve',@ManagerId,DATEADD(MINUTE,780,CAST(@Yesterday AS DATETIME2(0))),N'Đã chấp thuận'),
(@Inv11,NULL,@Counter2,@CashB,'REFUND','CASH',22000,N'Khách trả toàn bộ đơn','Approve',@ManagerId,DATEADD(MINUTE,840,CAST(@Yesterday AS DATETIME2(0))),N'Đã chấp thuận'),
(@Inv3,NULL,@Counter1,@CashA,'REFUND','CASH',8000,N'Yêu cầu hoàn tiền đang chờ','Pending',NULL,NULL,NULL),
(@Inv1,NULL,@Counter1,@CashA,'EXCHANGE','CASH',12000,N'Đổi hàng sai mẫu - từ chối','Reject',@ManagerId,DATEADD(MINUTE,900,CAST(@Yesterday AS DATETIME2(0))),N'Không đủ điều kiện đổi');
DECLARE @RetApprovedPartial BIGINT,@RetApprovedFull BIGINT,@RetPending BIGINT,@RetRejected BIGINT;
SELECT @RetApprovedPartial=id FROM dbo.Returns WHERE invoiceId=@Inv10;
SELECT @RetApprovedFull=id FROM dbo.Returns WHERE invoiceId=@Inv11;
SELECT @RetPending=id FROM dbo.Returns WHERE invoiceId=@Inv3;
SELECT @RetRejected=id FROM dbo.Returns WHERE invoiceId=@Inv1;
INSERT INTO dbo.ReturnItems(returnId,invoiceItemId,productId,variantId,batchId,productName,unitName,
quantity,baseQuantity,refundAmount,restockApproved,checkedAt,checkedBy)
SELECT r.returnId,ii.id,ii.productId,ii.variantId,ii.batchId,ii.productName,ii.unitName,
 r.qty,r.qty, r.refundAmount,r.restock,r.checkedAt,r.checkedBy
FROM (VALUES
(@RetApprovedPartial,@Inv10,1.000,25000,'Approved',DATEADD(MINUTE,780,CAST(@Yesterday AS DATETIME2(0))),@ManagerId),
(@RetApprovedFull,@Inv11,1.000,22000,'Rejected',DATEADD(MINUTE,840,CAST(@Yesterday AS DATETIME2(0))),@ManagerId),
(@RetPending,@Inv3,1.000,8000,'Pending',NULL,NULL),
(@RetRejected,@Inv1,1.000,12000,'Rejected',DATEADD(MINUTE,900,CAST(@Yesterday AS DATETIME2(0))),@ManagerId)
) r(returnId,invoiceId,qty,refundAmount,restock,checkedAt,checkedBy)
CROSS APPLY (SELECT TOP 1 * FROM dbo.InvoiceItems ii0 WHERE ii0.invoiceId=r.invoiceId ORDER BY ii0.id) ii;
-- Validation: all 42 user tables must contain at least one row.
DECLARE @EmptyTables NVARCHAR(MAX) = N'';
DECLARE @Tb SYSNAME;
DECLARE demo_tables CURSOR LOCAL FAST_FORWARD FOR
SELECT t.name FROM sys.tables t WHERE t.schema_id=SCHEMA_ID('dbo') ORDER BY t.name;
OPEN demo_tables;
FETCH NEXT FROM demo_tables INTO @Tb;
WHILE @@FETCH_STATUS=0
BEGIN
  DECLARE @Count BIGINT;
  DECLARE @Sql NVARCHAR(MAX)=N'SELECT @N=COUNT_BIG(*) FROM dbo.'+QUOTENAME(@Tb);
  EXEC sp_executesql @Sql,N'@N BIGINT OUTPUT',@N=@Count OUTPUT;
  IF @Count=0 SET @EmptyTables=@EmptyTables+CASE WHEN @EmptyTables=N'' THEN N'' ELSE N', ' END+@Tb;
  FETCH NEXT FROM demo_tables INTO @Tb;
END;
CLOSE demo_tables;
DEALLOCATE demo_tables;
IF @EmptyTables<>N'' THROW 51001, 'One or more schema tables have no demo rows; transaction rolled back.', 1;
-- Every PAID invoice must have a successful payment for the basic checkout demo.
IF EXISTS (SELECT 1 FROM dbo.Invoices i WHERE i.invoiceCode LIKE 'DEMO-%' AND i.status='PAID'
  AND NOT EXISTS(SELECT 1 FROM dbo.Payments p WHERE p.invoiceId=i.id AND p.status='SUCCESS'))
    THROW 51002, 'Demo PAID invoices missing SUCCESS payments.', 1;
IF EXISTS (SELECT 1 FROM dbo.CashHandovers h JOIN dbo.WorkSchedules w ON w.id=h.scheduleId
    WHERE h.openingCash<>w.openingCash)
    THROW 51003, 'Opening cash mismatch between CashHandovers and WorkSchedules.', 1;
COMMIT TRANSACTION;
PRINT N'Demo seed loaded successfully: ALL 42 TABLES populated.';
END TRY
BEGIN CATCH
  IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
-- Verify counts (after successful COMMIT):
SELECT t.name AS TableName, p.rows AS EstimatedRowCount
FROM sys.tables t JOIN sys.partitions p ON p.object_id=t.object_id AND p.index_id=1
WHERE t.schema_id=SCHEMA_ID('dbo')
ORDER BY t.name;
