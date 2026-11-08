import { PATHS } from './paths';
import { PERMISSIONS as P } from '../constants/permissions';

// 5 mục menu chính: Sản phẩm, Khuyến mãi, Nhân viên, Ca làm việc, Bàn giao tiền
export const MENU = Object.freeze([
  { label: 'Sản phẩm', path: PATHS.PRODUCTS, permission: P.PRODUCT_VIEW, enabled: true, uc: 'UC48' },
  { label: 'Khuyến mãi', path: PATHS.PROMOTIONS, permission: P.PROMOTION_VIEW, enabled: false, uc: 'UC53, UC54, UC56' },
  { label: 'Nhân viên', path: PATHS.STAFF, permission: P.STAFF_VIEW, enabled: false, uc: 'UC64, UC66' },
  { label: 'Ca làm việc', path: PATHS.SHIFTS, permission: P.SHIFT_VIEW, enabled: true, uc: 'UC75, UC81, UC73' },
  {
    label: 'Bàn giao tiền',
    path: PATHS.CASH_HANDOVER,
    permission: [P.SHIFT_CASH_HANDOVER, P.CASH_HANDOVER_CREATE, P.CASH_REPORT_VIEW, P.CASH_HANDOVER_REPORT],
    enabled: true,
    uc: 'UC82, UC83',
  },
]);

/** Menu items the user may see (UI only; backend still checks permissions). */
export function filterMenu(permissions = []) {
  return MENU.filter((item) => {
    if (!item.permission) return true;
    return Array.isArray(item.permission)
      ? item.permission.some((key) => permissions.includes(key))
      : permissions.includes(item.permission);
  });
}
