const fs = require('node:fs');
const path = require('node:path');
const { getPool, closePool } = require('../src/shared/config/database');
(async () => {
  try {
    const pool = await getPool();
    await pool.request().batch(fs.readFileSync(path.resolve(__dirname, '../../Database/migrations/002_staff_account_security.sql'), 'utf8'));
    console.log('Staff account security migration applied (safe to rerun).');
  } catch (error) {
    console.error('Staff migration failed:', error.code || '', error.message);
    process.exitCode = 1;
  } finally { await closePool(); }
})();
