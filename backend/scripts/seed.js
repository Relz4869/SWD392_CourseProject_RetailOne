const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { sql, getPool, withTransaction, closePool } = require('../src/shared/config/database');
const { ROLES } = require('../src/shared/constants/roles');
const { PERMISSIONS, PERMISSION_DESCRIPTIONS, ROLE_PERMISSIONS } = require('../src/shared/constants/permissions');

const TEST_ACCOUNTS = [
  { username: 'manager', password: 'Manager@123', role: ROLES.MANAGER, isActive: 'active', requirePasswordChange: 0, fullName: 'Nguyễn Văn Quản', phone: '0900000001' },
  { username: 'cashier01', password: 'Cashier@123', role: ROLES.CASHIER, isActive: 'active', requirePasswordChange: 0, fullName: 'Trần Thị Thu', phone: '0900000002' },
  { username: 'warehouse01', password: 'Warehouse@123', role: ROLES.WAREHOUSE, isActive: 'active', requirePasswordChange: 0, fullName: 'Lê Văn Kho', phone: '0900000003' },
  { username: 'locked01', password: 'Locked@123', role: ROLES.CASHIER, isActive: 'locked', requirePasswordChange: 0, fullName: 'Phạm Văn Khóa', phone: '0900000004' },
  { username: 'newcashier', password: 'Newcashier@123', role: ROLES.CASHIER, isActive: 'active', requirePasswordChange: 1, fullName: 'Đỗ Thị Mới', phone: '0900000005' },
];

async function runDemoSqlIfAvailable() {
  const demoPath = path.resolve(__dirname, '../../Database/RetailOne_Demo_Records.sql');
  if (!fs.existsSync(demoPath)) return false;

  console.log('[SEED] Checking demo records from RetailOne_Demo_Records.sql...');
  const pool = await getPool();
  const check = await pool.request().query("SELECT COUNT(*) AS total FROM dbo.Users WHERE username = 'demo_manager'");
  if (check.recordset[0].total > 0) {
    console.log('[SEED] RetailOne_Demo_Records already loaded.');
    return true;
  }

  console.log('[SEED] Executing Database/RetailOne_Demo_Records.sql batches...');
  const content = fs.readFileSync(demoPath, 'utf8');
  const batches = content
    .split(/\r?\nGO\b/i)
    .map((b) => b.trim())
    .filter((b) => b.length > 0 && !b.startsWith('USE '));

  for (const batch of batches) {
    await pool.request().batch(batch);
  }
  console.log('[SEED] RetailOne_Demo_Records executed successfully.');
  return true;
}

async function findOrCreateRole(tx, roleTarget) {
  const targetNorm = roleTarget.trim().toLowerCase();
  const allRolesRes = await new sql.Request(tx).query('SELECT id, name FROM dbo.Roles');
  const allRoles = allRolesRes.recordset;

  let match = allRoles.find((r) => r.name && r.name.trim().toLowerCase() === targetNorm);
  if (match) return match.id;

  const insertRes = await new sql.Request(tx)
    .input('name', sql.NVarChar(50), roleTarget)
    .input('description', sql.NVarChar(sql.MAX), `Role ${roleTarget}`)
    .query('INSERT INTO dbo.Roles (name, description) OUTPUT INSERTED.id VALUES (@name, @description)');

  if (!insertRes.recordset || insertRes.recordset.length === 0) {
    const list = allRoles.map((r) => r.name);
    throw new Error(`Role not found and failed to insert: ${roleTarget}. Roles in DB: ${list.join(', ')}`);
  }
  return insertRes.recordset[0].id;
}

async function seed() {
  try {
    console.log('[SEED] Connecting to database...');
    await getPool();

    await runDemoSqlIfAvailable();

    await withTransaction(async (tx) => {
      // 1. Roles
      const roleCheck = await new sql.Request(tx).query('SELECT COUNT(*) AS cnt FROM dbo.Roles');
      if (roleCheck.recordset[0].cnt === 0) {
        console.log('[SEED] Inserting Roles...');
        for (const role of [ROLES.MANAGER, ROLES.CASHIER, ROLES.WAREHOUSE]) {
          await new sql.Request(tx)
            .input('name', sql.NVarChar(50), role)
            .input('description', sql.NVarChar(sql.MAX), `Role ${role}`)
            .query('INSERT INTO dbo.Roles (name, description) VALUES (@name, @description)');
        }
      }

      // 2. Features & RoleFeatures
      console.log('[SEED] Ensuring Features and RoleFeatures...');
      for (const [key, desc] of Object.entries(PERMISSION_DESCRIPTIONS)) {
        await new sql.Request(tx)
          .input('key', sql.VarChar(100), key)
          .input('desc', sql.NVarChar(sql.MAX), desc)
          .query(`
            IF NOT EXISTS (SELECT 1 FROM dbo.Features WHERE featureKey = @key)
            BEGIN
              INSERT INTO dbo.Features (featureKey, description) VALUES (@key, @desc)
            END
          `);
      }

      for (const [roleName, keys] of Object.entries(ROLE_PERMISSIONS)) {
        const roleId = await findOrCreateRole(tx, roleName);

        for (const key of keys) {
          await new sql.Request(tx)
            .input('roleId', sql.Int, roleId)
            .input('key', sql.VarChar(100), key)
            .query(`
              IF NOT EXISTS (
                SELECT 1 FROM dbo.RoleFeatures rf
                JOIN dbo.Features f ON f.id = rf.featureId
                WHERE rf.roleId = @roleId AND f.featureKey = @key
              )
              BEGIN
                INSERT INTO dbo.RoleFeatures (roleId, featureId)
                SELECT @roleId, id FROM dbo.Features WHERE featureKey = @key
              END
            `);
        }
      }

      // 3. Test Users & Staff from Spec 5.7
      console.log('[SEED] Ensuring 5 test accounts (spec 5.7)...');
      for (const acc of TEST_ACCOUNTS) {
        const uCheck = await new sql.Request(tx)
          .input('username', sql.VarChar(50), acc.username)
          .query('SELECT id FROM dbo.Users WHERE username = @username');

        let userId = uCheck.recordset[0]?.id;
        if (!userId) {
          const roleId = await findOrCreateRole(tx, acc.role);
          const hash = await bcrypt.hash(acc.password, 10);

          const insUser = await new sql.Request(tx)
            .input('roleId', sql.Int, roleId)
            .input('username', sql.VarChar(50), acc.username)
            .input('hash', sql.VarChar(255), hash)
            .input('isActive', sql.VarChar(20), acc.isActive)
            .input('reqPwd', sql.Bit, acc.requirePasswordChange)
            .query(`
              INSERT INTO dbo.Users (roleId, username, passwordHash, isActive, requirePasswordChange)
              OUTPUT INSERTED.id
              VALUES (@roleId, @username, @hash, @isActive, @reqPwd)
            `);
          if (!insUser.recordset || insUser.recordset.length === 0) {
            throw new Error(`Failed to insert user: ${acc.username}`);
          }
          userId = insUser.recordset[0].id;
        }

        const sCheck = await new sql.Request(tx)
          .input('userId', sql.Int, userId)
          .query('SELECT id FROM dbo.Staff WHERE userId = @userId');

        if (sCheck.recordset.length === 0) {
          await new sql.Request(tx)
            .input('userId', sql.Int, userId)
            .input('fullName', sql.NVarChar(100), acc.fullName)
            .input('phone', sql.VarChar(20), acc.phone)
            .query(`
              INSERT INTO dbo.Staff (userId, fullName, phoneNumber, salaryType, baseSalary, employmentStatus)
              VALUES (@userId, @fullName, @phone, 'monthly', 10000000, 'working')
            `);
        }
      }

      // 4. Final verification: all keys in ROLE_PERMISSIONS must exist in dbo.Roles
      const dbRolesRes = await new sql.Request(tx).query('SELECT name FROM dbo.Roles');
      const dbRoleNames = dbRolesRes.recordset.map((r) => r.name);
      for (const expectedRole of Object.keys(ROLE_PERMISSIONS)) {
        if (!dbRoleNames.includes(expectedRole)) {
          throw new Error(`Missing role in dbo.Roles: ${expectedRole}. Roles in DB: ${dbRoleNames.join(', ')}`);
        }
      }

      console.log('[SEED] Seed completed successfully.');
    });
  } catch (err) {
    console.error('[SEED] Error stack:\n', err.stack || err);
    process.exitCode = 1;
  } finally {
    await closePool().catch(() => {});
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seed };
