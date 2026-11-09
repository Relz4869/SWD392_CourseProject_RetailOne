const fs = require('node:fs');
const path = require('node:path');
const { getPool, closePool } = require('../src/shared/config/database');

async function main() {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`SELECT COL_LENGTH('dbo.Promotions','requestKey') AS requestKey,
      COL_LENGTH('dbo.Promotions','requestHash') AS requestHash,
      OBJECT_ID('dbo.PromotionProductExclusions','U') AS exclusions`);
    const state = result.recordset[0];
    if (state.requestKey && state.requestHash && state.exclusions) {
      console.log('Promotion migration already applied.');
      return;
    }
    if (state.requestKey || state.requestHash || state.exclusions) throw new Error('Partial promotion migration detected; inspect schema before continuing.');
    const migration = fs.readFileSync(path.resolve(__dirname, '../../Database/migrations/001_promotion_flows.sql'), 'utf8');
    await pool.request().batch(migration);
    console.log('Promotion migration applied. Existing records preserved.');
  } catch (error) {
    console.error('Promotion migration failed:', error.code || '', error.message);
    process.exitCode = 1;
  } finally { await closePool(); }
}
main();
