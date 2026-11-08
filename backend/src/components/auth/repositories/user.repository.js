const { sql, request } = require('../../../shared/config/database');
const LoginAccount = require('../models/loginAccount.model');

async function findLoginAccountByUsername(username, tx) {
  const req = await request(tx);
  req.input('username', sql.VarChar(50), username);
  const result = await req.query(`
    SELECT u.id AS userId, u.username, u.passwordHash, u.isActive, u.requirePasswordChange,
           u.roleId, r.name AS role,
           s.id AS staffId, s.fullName, s.employmentStatus
    FROM dbo.Users u
    JOIN dbo.Roles r ON r.id = u.roleId
    LEFT JOIN dbo.Staff s ON s.userId = u.id
    WHERE u.username = @username;
  `);

  if (!result.recordset || result.recordset.length === 0) {
    return null;
  }
  return LoginAccount.fromRow(result.recordset[0]);
}

async function findLoginAccountById(userId, tx) {
  const req = await request(tx);
  req.input('userId', sql.Int, userId);
  const result = await req.query(`
    SELECT u.id AS userId, u.username, u.passwordHash, u.isActive, u.requirePasswordChange,
           u.roleId, r.name AS role,
           s.id AS staffId, s.fullName, s.employmentStatus
    FROM dbo.Users u
    JOIN dbo.Roles r ON r.id = u.roleId
    LEFT JOIN dbo.Staff s ON s.userId = u.id
    WHERE u.id = @userId;
  `);

  if (!result.recordset || result.recordset.length === 0) {
    return null;
  }
  return LoginAccount.fromRow(result.recordset[0]);
}

async function findPermissionKeysByRoleId(roleId, tx) {
  const req = await request(tx);
  req.input('roleId', sql.Int, roleId);
  const result = await req.query(`
    SELECT f.featureKey
    FROM dbo.RoleFeatures rf
    JOIN dbo.Features f ON f.id = rf.featureId
    WHERE rf.roleId = @roleId;
  `);

  return (result.recordset || []).map((row) => row.featureKey);
}

module.exports = {
  findLoginAccountByUsername,
  findLoginAccountById,
  findPermissionKeysByRoleId,
};
