# PHASE 2 – Models + Seed

> Đọc kèm `00_RULES.md` (nhất là mục 3.1). Mục 4.x nhắc tới nằm ở `01_PHASE1_SKELETON.md`.
> **Phạm vi:** models của **cả 15 UC** + unit test + seed. Chưa viết service/controller của UC nào.



### 5.1 `shared/models/BaseModel.js`

Mỗi model là một class kế thừa `BaseModel` và khai báo:
- `static TABLE` – tên bảng có schema (`'dbo.Users'`). Read model không có `TABLE`.
- `static COLUMNS` – `{ propName: { type: sql.X, pk?, identity?, nullable?, computed?, bigint?, sensitive? } }`
- Enum trạng thái là `static` frozen object, **giá trị phải khớp CHECK constraint** trong SQL.
- **Các phương thức nghiệp vụ** theo mục 5.4.

`BaseModel` cung cấp:
- `constructor(props = {})`: gán các key có trong `COLUMNS`. Dùng khi service tạo đối tượng mới (vd. `new CashHandover({...})`).
- `static fromRow(row)`: tạo instance từ row DB, chỉ lấy key có trong `COLUMNS`. Cột có `bigint: true` → `Number(value)` (**driver mssql trả BIGINT dạng string**). `null` vẫn giữ `null`. Trả `null` nếu `row` rỗng.
- `static insertableColumns()`: các cột trừ `identity` và `computed` (để repository không bao giờ INSERT cột tự tăng hoặc cột tính toán).
- `toPersistence()`: object gồm các cột insertable với giá trị hiện tại, để repository dùng khi INSERT/UPDATE.
- `toJSON()`: bỏ các cột `sensitive: true`. `res.json(model)` sẽ tự gọi hàm này.

Driver `mssql` trả: DECIMAL → `number`, BIT → `boolean`, DATE/DATETIME2 → `Date` (giờ địa phương vì `useUTC: false`).

Cột kiểu `TIME` khi SELECT phải dùng `CONVERT(VARCHAR(8), col, 108) AS col` để nhận chuỗi `'HH:mm:ss'`, không nhận JS Date.

### 5.2 Danh sách models (đúng theo `RetailOne_DB_Schema.sql`)

Ký hiệu: **PK** khóa chính, **ID** identity, **UQ** unique, **FK** khóa ngoại, **C** computed (không insert), **S** sensitive (ẩn khi trả về).

#### Component `auth`
**Role** – `dbo.Roles`
| prop | SQL | ghi chú |
|---|---|---|
| id | INT | PK, ID |
| name | NVARCHAR(50) | UQ; giá trị: `Manager`, `Cashier`, `Warehouse` |
| description | NVARCHAR(MAX) | null |

**Feature** – `dbo.Features`: `id` INT PK ID · `featureKey` VARCHAR(100) UQ · `description` NVARCHAR(MAX) null

**RoleFeature** – `dbo.RoleFeatures`: `roleId` INT FK→Roles · `featureId` INT FK→Features · PK (roleId, featureId)

**User** – `dbo.Users`
| prop | SQL | ghi chú |
|---|---|---|
| id | INT | PK, ID |
| roleId | INT | FK→Roles |
| username | VARCHAR(50) | UQ |
| passwordHash | VARCHAR(255) | **S**, bcrypt |
| isActive | VARCHAR(20) | `'active'` \| `'locked'`, mặc định `'active'` (UC66) |
| requirePasswordChange | BIT | mặc định 1 (BR-01: lần đầu đăng nhập / sau reset) |
| createdAt | DATETIME2 | mặc định SYSDATETIME() |

`User.STATUS = { ACTIVE: 'active', LOCKED: 'locked' }`

#### Component `manage-staff`
**Staff** – `dbo.Staff`
| prop | SQL | ghi chú |
|---|---|---|
| id | BIGINT | PK, ID, bigint |
| userId | INT | FK→Users, UQ, **NOT NULL** (mỗi Staff có đúng 1 User) |
| fullName | NVARCHAR(100) | |
| phoneNumber | VARCHAR(20) | UQ |
| email | VARCHAR(100) | null |
| salaryType | VARCHAR(20) | `'monthly'` \| `'hourly'`, mặc định `'hourly'` |
| baseSalary | DECIMAL(15,2) | ≥ 0, mặc định 0 |
| employmentStatus | VARCHAR(20) | `'working'` \| `'resigned'` (enum ở `shared/constants/staff.js`) |
| idCard | VARCHAR(20) | null, **S**, chỉ chữ số, unique khi khác null |
| resignationDate | DATE | null; bắt buộc khi `resigned` |
| createdAt | DATETIME2 | |

> Ghi chú cho `docs/SCHEMA_NOTES.md`: comment trong SQL nói "Staff may exist without a login (userId NULL)" nhưng cột là NOT NULL. Code theo **NOT NULL**.

#### Component `manage-product`
**Category** – `dbo.Categories`: `id` INT PK ID · `name` NVARCHAR(100) · `parentId` INT null FK→Categories (cây danh mục) · `status` BIT mặc định 1 (1 = active) · `imageUrl` NVARCHAR(500) null

**Product** – `dbo.Products`
| prop | SQL | ghi chú |
|---|---|---|
| id | BIGINT | PK, ID, bigint |
| code | VARCHAR(50) | UQ (BR-57) |
| name | NVARCHAR(200) | |
| categoryId | INT | null, FK→Categories |
| baseUnit | NVARCHAR(20) | |
| allowDecimalQuantity | BIT | mặc định 0 |
| isCombo | BIT | mặc định 0 |
| status | VARCHAR(20) | `'Selling'` \| `'StopSelling'` \| `'Suspended'`; xóa mềm qua status (BR-59) |
| createdAt, updatedAt | DATETIME2 | |
| imageUrl | NVARCHAR(500) | null |

**ProductVariant** – `dbo.ProductVariants` (một dòng = một đơn vị bán: cái/lốc/thùng)
| prop | SQL | ghi chú |
|---|---|---|
| id | INT | PK, ID |
| productId | BIGINT | FK→Products, bigint |
| unitName | NVARCHAR(20) | UQ cùng productId |
| conversionFactor | INT | > 0; số đơn vị cơ bản trong 1 variant. `1` = đơn vị cơ bản |
| salePrice | DECIMAL(15,2) | ≥ 0 |
| barcode | VARCHAR(50) | null, unique khi khác null (BR-57) |
| unitType | VARCHAR(20) | `'PIECE'` \| `'WEIGHT'` |

**ProductSalePriceHistory** – `dbo.ProductSalePriceHistories`: `id` INT PK ID · `productId` BIGINT · `variantId` INT · `oldSalePrice` DECIMAL(15,2) null · `newSalePrice` DECIMAL(15,2) null · `changedBy` BIGINT FK→Staff · `changedAt` DATETIME2

**InventoryStock** – `dbo.InventoryStocks` (**read-only** trong component này): `variantId` INT PK FK→ProductVariants · `quantityOnHand` DECIMAL(15,3) · `minThreshold` DECIMAL(15,3)

#### Component `manage-promotion`
**Promotion** – `dbo.Promotions`
| prop | SQL | ghi chú |
|---|---|---|
| id | BIGINT | PK, ID, bigint |
| name | NVARCHAR(255) | |
| type | VARCHAR(20) | `'Percent'` \| `'Amount'` |
| value | DECIMAL(15,2) | > 0; ≤ 100 nếu Percent |
| minInvoiceValue | DECIMAL(15,2) | ≥ 0, mặc định 0 |
| maxBudget | DECIMAL(15,2) | null hoặc > 0 |
| startDate, endDate | DATETIME2 | endDate > startDate |
| status | VARCHAR(20) | `'Active'` \| `'Disabled'` \| `'Expired'` \| `'Deleted'` (Deleted = xóa mềm; "Upcoming" = Active và startDate > now) |
| createdAt | DATETIME2 | |

**PromotionProduct** – `dbo.PromotionProducts`: `id` INT PK ID · `promotionId` BIGINT FK (cascade) · `productId` BIGINT null · `categoryId` INT null · `variantId` INT null.
Ràng buộc: **đúng một** trong `productId` / `categoryId` khác null; `variantId` chỉ có khi có `productId` và phải thuộc product đó.

#### Component `manage-shift`
**Shift** – `dbo.Shifts`: `id` INT PK ID · `name` NVARCHAR(50) · `startTime` TIME · `endTime` TIME (> startTime, BR-76) · `checkInStart` TIME null · `checkInEnd` TIME null · `checkOutDeadline` TIME null · `isActive` BIT mặc định 1

**WorkSchedule** – `dbo.WorkSchedules`
| prop | SQL | ghi chú |
|---|---|---|
| id | INT | PK, ID |
| staffId | BIGINT | FK→Staff, bigint |
| shiftId | INT | FK→Shifts |
| workDate | DATE | UQ (staffId, shiftId, workDate) |
| checkInTime, checkOutTime | DATETIME2 | null; checkOut ≥ checkIn |
| workedHours | FLOAT | ≥ 0, mặc định 0 |
| status | VARCHAR(20) | `'assigned'` \| `'working'` \| `'completed'` \| `'absent'` \| `'late'` |
| note | NVARCHAR(MAX) | null |
| attendanceRecord | VARCHAR(50) | mặc định `'OnTime'` |
| penaltyAmount | DECIMAL(15,2) | ≥ 0 |
| openingCash | DECIMAL(15,2) | null; thu ngân nhập khi check-in (UC73) |

#### Component `cash-handover`
**CashHandover** – `dbo.CashHandovers`
| prop | SQL | ghi chú |
|---|---|---|
| id | INT | PK, ID |
| scheduleId | INT | FK→WorkSchedules, UQ (1 ca 1 lần bàn giao) |
| handoverTime | DATETIME2 | mặc định now |
| openingCash | DECIMAL(15,2) | ≥ 0 |
| systemCash | DECIMAL(15,2) | ≥ 0 |
| actualCash | DECIMAL(15,2) | ≥ 0 |
| difference | DECIMAL | **C** = actual − (opening + system), **không insert** |
| note | NVARCHAR(MAX) | **bắt buộc** khi có chênh lệch (BR-10) |
| reviewStatus | VARCHAR(20) | `'Pending'` \| `'Reviewed'` |
| reviewedBy | BIGINT | null, FK→Staff |
| reviewedAt | DATETIME2 | null |
| reviewNote | NVARCHAR(500) | null |

### 5.3 Ví dụ model chuẩn (agent làm các model khác theo đúng mẫu này)

Model thuần dữ liệu cộng vài hành vi đơn giản:

```js
// backend/src/components/auth/models/user.model.js
const { sql } = require('../../../shared/config/database');
const BaseModel = require('../../../shared/models/BaseModel');

class User extends BaseModel {
  static TABLE = 'dbo.Users';

  static STATUS = Object.freeze({ ACTIVE: 'active', LOCKED: 'locked' });

  static COLUMNS = Object.freeze({
    id:                    { type: sql.Int, pk: true, identity: true },
    roleId:                { type: sql.Int },
    username:              { type: sql.VarChar(50) },
    passwordHash:          { type: sql.VarChar(255), sensitive: true },
    isActive:              { type: sql.VarChar(20) },
    requirePasswordChange: { type: sql.Bit },
    createdAt:             { type: sql.DateTime2 },
  });

  /** UC66 */
  isLocked() {
    return this.isActive === User.STATUS.LOCKED;
  }

  /** BR-01 */
  mustChangePassword() {
    return this.requirePasswordChange === true;
  }
}

module.exports = User;
```

Model có quy tắc thời gian (mẫu cho các model phức tạp):

```js
// backend/src/components/manage-promotion/models/promotion.model.js
const { sql } = require('../../../shared/config/database');
const BaseModel = require('../../../shared/models/BaseModel');

class Promotion extends BaseModel {
  static TABLE = 'dbo.Promotions';

  static TYPE = Object.freeze({ PERCENT: 'Percent', AMOUNT: 'Amount' });
  static STATUS = Object.freeze({ ACTIVE: 'Active', DISABLED: 'Disabled', EXPIRED: 'Expired', DELETED: 'Deleted' });

  static COLUMNS = Object.freeze({
    id:              { type: sql.BigInt, pk: true, identity: true, bigint: true },
    name:            { type: sql.NVarChar(255) },
    type:            { type: sql.VarChar(20) },
    value:           { type: sql.Decimal(15, 2) },
    minInvoiceValue: { type: sql.Decimal(15, 2) },
    maxBudget:       { type: sql.Decimal(15, 2), nullable: true },
    startDate:       { type: sql.DateTime2 },
    endDate:         { type: sql.DateTime2 },
    status:          { type: sql.VarChar(20) },
    createdAt:       { type: sql.DateTime2 },
  });

  isDeleted() {
    return this.status === Promotion.STATUS.DELETED;
  }

  hasEnded(now = new Date()) {
    return this.status === Promotion.STATUS.EXPIRED || this.endDate < now;
  }

  isRunning(now = new Date()) {
    return this.status === Promotion.STATUS.ACTIVE && this.startDate <= now && now <= this.endDate;
  }

  /** "Upcoming" is not stored in DB: Active and not started yet. */
  isUpcoming(now = new Date()) {
    return this.status === Promotion.STATUS.ACTIVE && this.startDate > now;
  }

  /** UC54: products can be assigned only while the promotion is not deleted or ended. */
  isEditable(now = new Date()) {
    return !this.isDeleted() && !this.hasEnded(now);
  }

  /** UC56: a running promotion must be disabled first. */
  canBeDeleted(now = new Date()) {
    return !this.isDeleted() && !this.isRunning(now);
  }

  /** UC56: soft delete, invoices keep referencing this row. */
  markDeleted(now = new Date()) {
    if (!this.canBeDeleted(now)) throw new Error('markDeleted() called when canBeDeleted() is false');
    this.status = Promotion.STATUS.DELETED;
    return this;
  }
}

module.exports = Promotion;
```

Model phối hợp với model khác (truyền model kia vào làm tham số, **không** tự truy vấn):

```js
// backend/src/components/manage-shift/models/workSchedule.model.js (behavior part)
const { toDateString, toTimeString, hoursBetween } = require('../../../shared/utils/date');

class WorkSchedule extends BaseModel {
  // ... TABLE, STATUS, ATTENDANCE, COLUMNS

  isAssigned() { return this.status === WorkSchedule.STATUS.ASSIGNED; }
  isWorking()  { return this.status === WorkSchedule.STATUS.WORKING; }
  belongsTo(staffId) { return Number(this.staffId) === Number(staffId); }
  isOnDate(now = new Date()) { return toDateString(this.workDate) === toDateString(now); }

  /** UC73 */
  canCheckIn(now, shift) {
    return this.isAssigned() && this.isOnDate(now) && shift.isInCheckInWindow(toTimeString(now));
  }

  /** UC73: openingCash is required for cashiers (checked by the service, which knows the role). */
  checkIn(now, shift, openingCash = null) {
    if (!this.canCheckIn(now, shift)) throw new Error('checkIn() called when canCheckIn() is false');
    this.checkInTime = now;
    this.status = WorkSchedule.STATUS.WORKING;
    this.attendanceRecord = shift.isLate(toTimeString(now))
      ? WorkSchedule.ATTENDANCE.LATE
      : WorkSchedule.ATTENDANCE.ON_TIME;
    this.openingCash = openingCash;
    return this;
  }

  /** UC82 */
  canHandOver() { return this.isWorking() && this.checkInTime != null; }

  /** UC82: end the shift after cash handover. */
  complete(now = new Date()) {
    if (!this.canHandOver()) throw new Error('complete() called when canHandOver() is false');
    this.checkOutTime = now;
    this.workedHours = hoursBetween(this.checkInTime, now);
    this.status = WorkSchedule.STATUS.COMPLETED;
    return this;
  }
}
```

### 5.4 Hành vi của từng model (bắt buộc làm đủ)

Thời gian dạng `'HH:mm:ss'` so sánh trực tiếp bằng chuỗi được (`'08:05:00' > '08:00:00'`). Tiền tính bằng `roundMoney()` để tránh lỗi số thực.

#### `shared/constants/staff.js`
`EMPLOYMENT_STATUS = Object.freeze({ WORKING: 'working', RESIGNED: 'resigned' })`. Cả `Staff` (manage-staff) và `LoginAccount` (auth) dùng hằng này.

#### Component `auth`

| Class | Phương thức | Quy tắc | UC/BR |
|---|---|---|---|
| `User` | `isLocked()` | `isActive === 'locked'` | UC66 |
| | `mustChangePassword()` | `requirePasswordChange === true` | BR-01 |
| `LoginAccount` (read model) | `isLocked()` | như `User` | UC69 E3 |
| | `hasResigned()` | `employmentStatus === EMPLOYMENT_STATUS.RESIGNED` | UC69 E4 |
| | `canLogin()` | `!isLocked() && !hasResigned()` | UC69, UC66 |
| | `mustChangePassword()` | như `User` | BR-01 |
| | `toTokenPayload()` | `{ userId, staffId, role }` | UC69 |
| | `toSessionUser()` | `{ userId, staffId, username, fullName, role, requirePasswordChange }`, **không** có `passwordHash` | UC69 |
| `Role`, `Feature`, `RoleFeature` | – | thuần dữ liệu | – |

`LoginAccount.COLUMNS`: `userId` INT, `username`, `passwordHash` (**S**), `isActive`, `requirePasswordChange` BIT, `roleId` INT, `role` (tên role), `staffId` (bigint), `fullName`, `employmentStatus`.

#### Component `manage-staff`

| Class | Phương thức | Quy tắc | UC/BR |
|---|---|---|---|
| `Staff` | `isWorking()` | `employmentStatus === 'working'` | – |
| | `isResigned()` | `employmentStatus === 'resigned'` | UC67 |
| | `canBeActivated()` | `isWorking()`: nhân viên đã nghỉ thì không mở lại tài khoản | UC66 |

#### Component `manage-product`

| Class | Phương thức | Quy tắc | UC/BR |
|---|---|---|---|
| `Category` | `isActive()` | `status === true` | UC39, UC42 |
| | `isRoot()` | `parentId == null` | UC39 |
| `Product` | `isSellable()` | `status === 'Selling'` | UC48 |
| | `canBeAssignedToPromotion()` | `isSellable()` | UC54 |
| `ProductVariant` | `isBaseUnit()` | `conversionFactor === 1` | UC42 |
| | `hasBarcode()` | `barcode` khác null và khác chuỗi rỗng | BR-57 |
| | `toBaseQuantity(qty)` | `qty * conversionFactor` | UC48 |
| | `isPriceChange(newPrice)` | `Number(newPrice) !== Number(salePrice)` | UC46 |
| | `changePrice(newPrice, changedBy, now)` | gán `salePrice` mới, **trả về** `new ProductSalePriceHistory({ productId, variantId: id, oldSalePrice, newSalePrice, changedBy, changedAt: now })`. Gọi khi `isPriceChange()` sai thì ném `Error` | UC46, BR-64 |
| `ProductSalePriceHistory` | – | thuần dữ liệu (lịch sử không được sửa) | UC50 |
| `InventoryStock` (read-only) | `isOutOfStock()` | `quantityOnHand <= 0` | UC48 |
| | `isBelowThreshold()` | `minThreshold > 0 && quantityOnHand <= minThreshold` | BR-41 |
| `ProductListItem` (read model) | xem mục 7.2 | | UC48 |

#### Component `manage-promotion`

| Class | Phương thức | Quy tắc | UC/BR |
|---|---|---|---|
| `Promotion` | `isDeleted()`, `hasEnded(now)`, `isRunning(now)`, `isUpcoming(now)`, `isEditable(now)`, `canBeDeleted(now)`, `markDeleted(now)` | như ví dụ ở 5.3 | UC53, UC54, UC56 |
| `PromotionProduct` | `isProductTarget()` | `productId != null` | UC54 |
| | `isCategoryTarget()` | `categoryId != null` | UC54 |
| | `isValidTarget()` | đúng **một** trong `productId`/`categoryId` khác null, và `variantId` chỉ có khi có `productId` (khớp `CK_PP_Target`, `CK_PP_Variant`) | UC54 |

Tính số tiền giảm giá (Percent/Amount) **chưa làm**. Khi làm module bán hàng sẽ thêm `DiscountStrategy` với `PercentDiscount` và `AmountDiscount`.

#### Component `manage-shift`

| Class | Phương thức | Quy tắc | UC/BR |
|---|---|---|---|
| `Shift` | `hasValidTimeRange()` | `endTime > startTime`. Ca qua đêm **không** hỗ trợ vì CHECK `CK_Shift_Time` | UC75, BR-76 |
| | `checkInWindow()` | `{ from: checkInStart ?? startTime, to: checkInEnd ?? endTime }` (**giả định**, đối chiếu BR khi có SRS) | UC73 |
| | `isInCheckInWindow(time)` | `from <= time <= to` | UC73 |
| | `isLate(time)` | `time > startTime` | UC73 |
| | `durationHours()` | số giờ từ `startTime` đến `endTime` | UC79 |
| `WorkSchedule` | `isAssigned()`, `isWorking()`, `belongsTo(staffId)`, `isOnDate(now)`, `canCheckIn(now, shift)`, `checkIn(now, shift, openingCash)`, `canHandOver()`, `complete(now)` | như ví dụ ở 5.3. Khi check-in, `status` chuyển sang `'working'`, còn đi muộn ghi vào `attendanceRecord = 'Late'` | UC73, UC82 |

#### Component `cash-handover`

| Class | Phương thức | Quy tắc | UC/BR |
|---|---|---|---|
| `CashHandover` | `static fromSchedule(schedule, { systemCash, actualCash, note })` | tạo mới với `scheduleId = schedule.id`, `openingCash = schedule.openingCash ?? 0`, `reviewStatus = 'Pending'` | UC82 |
| | `expectedCash()` | `roundMoney(openingCash + systemCash)` | UC82 |
| | `difference()` | `roundMoney(actualCash - expectedCash())`, **phải bằng** cột computed `difference` trong DB | UC82, UC83 |
| | `hasDiscrepancy()` | `difference() !== 0` | UC83 |
| | `requiresNote()` | `hasDiscrepancy()` | BR-10 |
| | `hasValidNote()` | `!requiresNote() || note?.trim().length > 0` (khớp `CK_Handover_NoteOnDiff`) | BR-10 |

### 5.5 Unit test cho hành vi model

Test bằng `node:test` + `node:assert`, **không cần DB**. Đặt cạnh model: `promotion.model.test.js`. Mỗi phương thức có ít nhất 1 ca đúng và 1 ca sai. Các ca bắt buộc:

| Model | Ca test bắt buộc |
|---|---|
| `LoginAccount` | active + working → `canLogin` true; locked → false; resigned → false; `toSessionUser()` không chứa `passwordHash` |
| `Promotion` | đang chạy → `canBeDeleted` false; sắp diễn ra → true; Disabled trong thời gian chạy → true; đã Deleted → false; `markDeleted` khi đang chạy → ném Error |
| `PromotionProduct` | chỉ productId → hợp lệ; cả productId và categoryId → không hợp lệ; variantId không có productId → không hợp lệ |
| `ProductVariant` | `toBaseQuantity(2)` với factor 24 → 48; `changePrice` trả về history có đúng `oldSalePrice`/`newSalePrice`; cùng giá → ném Error |
| `Shift` | check-in đúng `checkInStart`/`checkInEnd` (biên) → true; trước/sau cửa sổ → false; cửa sổ null dùng `startTime`/`endTime`; `isLate` tại đúng `startTime` → false |
| `WorkSchedule` | `checkIn` đúng giờ → `OnTime`; muộn → `Late`; khác ngày → `canCheckIn` false; `complete` tính đúng `workedHours` |
| `CashHandover` | khớp tiền → `requiresNote` false; thiếu 0.01 → true; lệch mà note chỉ có khoảng trắng → `hasValidNote` false; `0.1 + 0.2` không gây lệch giả |

```js
// backend/src/components/manage-promotion/models/promotion.model.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const Promotion = require('./promotion.model');

const now = new Date('2026-11-10T10:00:00');
const make = (props) => new Promotion({
  status: 'Active', startDate: new Date('2026-11-01'), endDate: new Date('2026-11-30'), ...props,
});

test('running promotion cannot be deleted (UC56)', () => {
  assert.strictEqual(make().canBeDeleted(now), false);
});

test('upcoming promotion can be deleted (UC56)', () => {
  const p = make({ startDate: new Date('2026-12-01'), endDate: new Date('2026-12-31') });
  assert.strictEqual(p.canBeDeleted(now), true);
});

test('markDeleted on a running promotion throws', () => {
  assert.throws(() => make().markDeleted(now));
});
```

### 5.6 Permission keys (`shared/constants/permissions.js`)

Giá trị `PERMISSIONS` = `Features.featureKey`.

```
CATEGORY_VIEW, CATEGORY_CREATE,
PRODUCT_VIEW, PRODUCT_CREATE, PRODUCT_PRICE_VIEW, PRODUCT_PRICE_UPDATE,
PROMOTION_VIEW, PROMOTION_CREATE, PROMOTION_ASSIGN_PRODUCT, PROMOTION_DELETE,
STAFF_VIEW, STAFF_CREATE, STAFF_CHANGE_STATUS,
SHIFT_VIEW, SHIFT_CREATE, SCHEDULE_ASSIGN, SCHEDULE_CHECK_IN,
CASH_HANDOVER_CREATE, CASH_HANDOVER_REPORT
```

`ROLE_PERMISSIONS` (NFR RBAC: Warehouse **không** được xem giá, doanh thu, dữ liệu HR):
- **Manager:** tất cả, **trừ** `SCHEDULE_CHECK_IN` và `CASH_HANDOVER_CREATE`
- **Cashier:** `CATEGORY_VIEW, PRODUCT_VIEW, PRODUCT_PRICE_VIEW, SCHEDULE_CHECK_IN, CASH_HANDOVER_CREATE`
- **Warehouse:** `CATEGORY_VIEW, PRODUCT_VIEW, SCHEDULE_CHECK_IN`

### 5.7 Seed (`backend/scripts/seed.js`)

Script SQL **không có dữ liệu mẫu**, nên phải có seed. Seed chạy **ngay sau** khi chạy schema; schema tự DROP và tạo lại DB, nên muốn reset thì chạy lại cả hai. Toàn bộ seed nằm trong **một transaction**. Nếu bảng `Roles` đã có dữ liệu thì in thông báo và thoát, không chèn trùng.

1. **Roles:** Manager, Cashier, Warehouse
2. **Features:** toàn bộ key ở 5.6; **RoleFeatures** theo `ROLE_PERMISSIONS`
3. **Users + Staff** (hash bằng `bcryptjs`, `requirePasswordChange = 0` để tiện test):

| username | password | role | isActive | Staff.fullName | phone |
|---|---|---|---|---|---|
| manager | Manager@123 | Manager | active | Nguyễn Văn Quản | 0900000001 |
| cashier01 | Cashier@123 | Cashier | active | Trần Thị Thu | 0900000002 |
| warehouse01 | Warehouse@123 | Warehouse | active | Lê Văn Kho | 0900000003 |
| locked01 | Locked@123 | Cashier | **locked** | Phạm Văn Khóa | 0900000004 |
| newcashier | Newcashier@123 | Cashier | active, `requirePasswordChange = 1` | Đỗ Thị Mới | 0900000005 |

4. **Categories:** Đồ uống (con: Nước ngọt, Bia), Bánh kẹo, Gia vị
5. **Products (≥ 12 sản phẩm)**, mỗi sản phẩm có variant gốc `conversionFactor = 1` và một số có thêm variant lớn hơn (ví dụ `Lốc 6` = 6, `Thùng 24` = 24), barcode 13 chữ số không trùng. Có **ít nhất 1** sản phẩm `StopSelling` và **1** sản phẩm `Suspended` để test lọc. Mỗi variant có dòng `InventoryStocks` (có sản phẩm tồn 0).
   Ví dụ: `SP001 Coca-Cola lon 330ml` (Lon 10.000đ, Lốc 6 58.000đ, Thùng 24 220.000đ).
6. Mỗi variant có 1 dòng `ProductSalePriceHistories` (`oldSalePrice = NULL`, `newSalePrice` = giá hiện tại, `changedBy` = staffId của manager).

### ✅ Kiểm tra Phase 2
- Chạy schema trong SSMS, sau đó `npm run seed` → in số dòng đã chèn từng bảng, không lỗi.
- Viết `scripts/check-models.js`: với mỗi model **có `TABLE`**, so key của `COLUMNS` với cột thật trong `INFORMATION_SCHEMA.COLUMNS`. In ra cột thiếu hoặc thừa. Kết quả phải là **0 sai lệch**. Bỏ qua read model.
- `npm test` → toàn bộ ca test ở 5.5 **pass**, chạy được khi **không** kết nối DB.
- Kiểm tra bằng mắt: không file model nào `require` repository, service, `AppError` hay `express`.

---
