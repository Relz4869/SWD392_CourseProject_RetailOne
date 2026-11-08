// Role names = dbo.Roles.name (exact match from DB: Manager / Cashier / Warehouse Staff)
const ROLES = Object.freeze({
  MANAGER: 'Manager',
  CASHIER: 'Cashier',
  WAREHOUSE: 'Warehouse Staff',
});

const ROLE_LIST = Object.freeze(Object.values(ROLES));

module.exports = { ROLES, ROLE_LIST };
