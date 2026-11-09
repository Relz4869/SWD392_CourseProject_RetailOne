const fs = require('node:fs');
const path = require('node:path');
const { getPool, closePool } = require('../src/shared/config/database');

async function main() {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`SELECT
      OBJECT_ID('dbo.PromotionProductExclusions','U') AS exclusions,
      (SELECT is_nullable FROM sys.columns WHERE object_id=OBJECT_ID('dbo.Promotions') AND name='name') AS nameNullable,
      (SELECT is_nullable FROM sys.columns WHERE object_id=OBJECT_ID('dbo.Promotions') AND name='type') AS typeNullable,
      (SELECT is_nullable FROM sys.columns WHERE object_id=OBJECT_ID('dbo.Promotions') AND name='value') AS valueNullable,
      (SELECT is_nullable FROM sys.columns WHERE object_id=OBJECT_ID('dbo.Promotions') AND name='startDate') AS startDateNullable,
      (SELECT is_nullable FROM sys.columns WHERE object_id=OBJECT_ID('dbo.Promotions') AND name='endDate') AS endDateNullable`);
    const state = result.recordset[0];
    const nullable = ['nameNullable', 'typeNullable', 'valueNullable', 'startDateNullable', 'endDateNullable'];
    if (state.exclusions && nullable.every((key) => state[key] === true)) {
      console.log('Promotion migration already applied.');
      return;
    }
    if (state.exclusions || nullable.some((key) => state[key] === true)) {
      throw new Error('Partial promotion migration detected; inspect schema before continuing.');
    }
    const migration = fs.readFileSync(path.resolve(__dirname, '../../Database/migrations/001_promotion_flows.sql'), 'utf8');
    await pool.request().batch(migration);
    console.log('Promotion migration applied. Existing records preserved.');
  } catch (error) {
    console.error('Promotion migration failed:', error.code || '', error.message);
    process.exitCode = 1;
  } finally { await closePool(); }
}
main();
