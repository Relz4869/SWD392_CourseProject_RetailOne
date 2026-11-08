// Role names = dbo.Roles.name (see RetailOne_DB_Schema.sql: "Manager / Cashier / Warehouse").
const ROLES = Object.freeze({
  MANAGER: 'Manager',
  CASHIER: 'Cashier',
  WAREHOUSE: 'Warehouse',
});

const ROLE_LIST = Object.freeze(Object.values(ROLES));

module.exports = { ROLES, ROLE_LIST };

