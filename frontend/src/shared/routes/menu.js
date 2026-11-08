import { PATHS } from './paths';
import { PERMISSIONS as P } from '../constants/permissions';

export const MENU = Object.freeze([
  { label: 'Sản phẩm', path: PATHS.PRODUCTS, permission: P.PRODUCT_VIEW, enabled: true, uc: 'UC48' },
  { label: 'Khuyến mãi', path: PATHS.PROMOTIONS, permission: P.PROMOTION_VIEW, enabled: true, uc: 'UC53, UC54, UC56' },
  { label: 'Nhân viên', path: PATHS.STAFF, permission: P.STAFF_VIEW, enabled: true, uc: 'UC64, UC66' },
  { label: 'Ca làm việc', path: PATHS.SHIFTS, permission: P.SHIFT_VIEW, enabled: false, uc: 'UC75, UC81, UC73' },
  { label: 'Bàn giao tiền', path: PATHS.CASH_HANDOVER, permission: P.CASH_HANDOVER_REPORT, enabled: false, uc: 'UC82, UC83' },
]);

/** Menu items the user may see (UI only; backend still checks permissions). */
export function filterMenu(permissions = []) {
  return MENU.filter((item) => !item.permission || permissions.includes(item.permission));
}
