import { PATHS } from './paths';
import { PERMISSIONS as P } from '../constants/permissions';

// Sidebar menu for the 15 UCs (UC69 Login has no menu entry).
// Only Products is enabled in this iteration; the rest are shown dimmed ("Sắp có").
export const MENU = Object.freeze([
  { label: 'Sản phẩm', path: PATHS.PRODUCTS, permission: P.PRODUCT_VIEW, enabled: true, uc: 'UC48' },
  { label: 'Thêm sản phẩm', path: PATHS.PRODUCT_CREATE, permission: P.PRODUCT_CREATE, enabled: false, uc: 'UC42' },
  { label: 'Cập nhật giá bán', path: PATHS.PRODUCT_PRICES, permission: P.PRODUCT_PRICE_UPDATE, enabled: false, uc: 'UC46' },
  { label: 'Thêm danh mục', path: PATHS.CATEGORY_CREATE, permission: P.CATEGORY_CREATE, enabled: false, uc: 'UC39' },
  { label: 'Tạo khuyến mãi', path: PATHS.PROMOTION_CREATE, permission: P.PROMOTION_CREATE, enabled: false, uc: 'UC53' },
  { label: 'Gán SP khuyến mãi', path: PATHS.PROMOTIONS, permission: P.PROMOTION_ASSIGN_PRODUCT, enabled: false, uc: 'UC54' },
  { label: 'Xóa khuyến mãi', path: `${PATHS.PROMOTIONS}?action=delete`, permission: P.PROMOTION_DELETE, enabled: false, uc: 'UC56' },
  { label: 'Thêm nhân viên', path: PATHS.STAFF_CREATE, permission: P.STAFF_CREATE, enabled: false, uc: 'UC64' },
  { label: 'Khóa/mở tài khoản', path: PATHS.STAFF, permission: P.STAFF_CHANGE_STATUS, enabled: false, uc: 'UC66' },
  { label: 'Tạo ca làm', path: PATHS.SHIFTS, permission: P.SHIFT_CREATE, enabled: false, uc: 'UC75' },
  { label: 'Phân ca', path: PATHS.SCHEDULES, permission: P.SCHEDULE_ASSIGN, enabled: false, uc: 'UC81' },
  { label: 'Chấm công vào ca', path: PATHS.CHECK_IN, permission: P.SCHEDULE_CHECK_IN, enabled: false, uc: 'UC73' },
  { label: 'Bàn giao tiền', path: PATHS.CASH_HANDOVER, permission: P.CASH_HANDOVER_CREATE, enabled: false, uc: 'UC82' },
  { label: 'Báo cáo bàn giao', path: PATHS.CASH_HANDOVER_REPORT, permission: P.CASH_HANDOVER_REPORT, enabled: false, uc: 'UC83' },
]);

/** Menu items the user may see (UI only; backend still checks permissions). */
export function filterMenu(permissions = []) {
  return MENU.filter((item) => !item.permission || permissions.includes(item.permission));
}

