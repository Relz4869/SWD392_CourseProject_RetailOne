// Copy of backend/src/shared/constants/roles.js (exact match from DB: Manager / Cashier / Warehouse Staff)
export const ROLES = Object.freeze({
  MANAGER: 'Manager',
  CASHIER: 'Cashier',
  WAREHOUSE: 'Warehouse Staff',
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.MANAGER]: 'Quản lý',
  [ROLES.CASHIER]: 'Thu ngân',
  [ROLES.WAREHOUSE]: 'Nhân viên kho',
});
