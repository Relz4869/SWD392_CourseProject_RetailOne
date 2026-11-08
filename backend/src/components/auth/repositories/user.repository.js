const { sql, request } = require('../../../shared/config/database');
const LoginAccount = require('../models/loginAccount.model');
const { expandPermissions } = require('../../../shared/constants/permissions');
const User = require('../models/user.model');

async function findLoginAccountByUsername(username, tx) {
  const req = await request(tx);
  req.input('username', sql.VarChar(50), username);
  const result = await req.query(`
    SELECT u.id AS userId, u.username, u.passwordHash, u.isActive, u.requirePasswordChange, u.tokenVersion,
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
    SELECT u.id AS userId, u.username, u.passwordHash, u.isActive, u.requirePasswordChange, u.tokenVersion,
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

  return expandPermissions((result.recordset || []).map((row) => row.featureKey));
}

async function save(user, tx) {
  const req = await request(tx);
  for (const key of ['roleId','username','passwordHash','isActive','requirePasswordChange']) req.input(key, User.COLUMNS[key].type, user[key]);
  const result = await req.query(`INSERT dbo.Users(roleId,username,passwordHash,isActive,requirePasswordChange)
    OUTPUT inserted.* VALUES(@roleId,@username,@passwordHash,@isActive,@requirePasswordChange)`);
  return User.fromRow(result.recordset[0]);
}
async function findByStaffId(staffId, tx) {
  const req = await request(tx);
  req.input('id', sql.BigInt, staffId);
  const result = await req.query('SELECT u.* FROM dbo.Users u WITH (UPDLOCK,HOLDLOCK) JOIN dbo.Staff s ON s.userId=u.id WHERE s.id=@id');
  return User.fromRow(result.recordset[0]);
}
async function updateActiveStatus(user, tx) {
  const req = await request(tx);
  req.input('id', sql.Int, user.id).input('status', sql.VarChar(20), user.isActive);
  // DB status and token revocation succeed or roll back together. Unlock also requires a fresh login.
  await req.query('UPDATE dbo.Users SET isActive=@status,tokenVersion=tokenVersion+1 WHERE id=@id');
}
async function updatePassword(userId, passwordHash, expectedVersion, tx) {
  const req = await request(tx);
  req.input('id', sql.Int, userId).input('hash', sql.VarChar(255), passwordHash).input('version', sql.Int, expectedVersion);
  const result = await req.query(`UPDATE dbo.Users SET passwordHash=@hash,requirePasswordChange=0,tokenVersion=tokenVersion+1
    WHERE id=@id AND tokenVersion=@version AND isActive='active'; SELECT @@ROWCOUNT AS updated;`);
  return result.recordset[0].updated === 1;
}

module.exports = {
  save, findByStaffId, updateActiveStatus, updatePassword,
  findLoginAccountByUsername,
  findLoginAccountById,
  findPermissionKeysByRoleId,
};
