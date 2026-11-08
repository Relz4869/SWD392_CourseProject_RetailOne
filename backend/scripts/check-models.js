const path = require('path');
const fs = require('fs');
const { getPool, closePool } = require('../src/shared/config/database');

async function checkModels() {
  let pool;
  try {
    pool = await getPool();
    console.log('[CHECK-MODELS] Connected to SQL Server.');

    const modelsDir = path.resolve(__dirname, '../src/components');
    const modelFiles = [];

    function findModelFiles(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          findModelFiles(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.model.js')) {
          modelFiles.push(fullPath);
        }
      }
    }

    findModelFiles(modelsDir);

    let totalDiscrepancies = 0;

    for (const filePath of modelFiles) {
      const ModelClass = require(filePath);
      if (!ModelClass.TABLE) {
        continue;
      }

      const tableFull = ModelClass.TABLE.replace(/[\[\]]/g, '');
      const parts = tableFull.split('.');
      const schemaName = parts.length > 1 ? parts[0] : 'dbo';
      const tableName = parts.length > 1 ? parts[1] : parts[0];

      const res = await pool
        .request()
        .input('tableSchema', schemaName)
        .input('tableName', tableName)
        .query(`
          SELECT COLUMN_NAME
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = @tableSchema AND TABLE_NAME = @tableName
        `);

      const dbCols = res.recordset.map((r) => r.COLUMN_NAME.toLowerCase());
      const modelCols = Object.keys(ModelClass.COLUMNS || {}).map((c) => c.toLowerCase());

      const missingInDb = modelCols.filter((c) => !dbCols.includes(c));
      const missingInModel = dbCols.filter((c) => !modelCols.includes(c));

      console.log(`\n=== Model: ${ModelClass.name} (Table: ${ModelClass.TABLE}) ===`);
      if (missingInDb.length > 0) {
        console.log(`  [+] Cột khai báo thừa trong Model (không có trong DB): ${missingInDb.join(', ')}`);
        totalDiscrepancies += missingInDb.length;
      }
      if (missingInModel.length > 0) {
        console.log(`  [-] Cột thiếu trong Model (có trong DB nhưng chưa khai báo): ${missingInModel.join(', ')}`);
        totalDiscrepancies += missingInModel.length;
      }

      if (missingInDb.length === 0 && missingInModel.length === 0) {
        console.log('  Khớp 100% (0 sai lệch).');
      }
    }

    console.log(`\n---------------------------------------`);
    console.log(`Tổng số sai lệch: ${totalDiscrepancies}`);
    if (totalDiscrepancies > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('[CHECK-MODELS] Error stack:\n', err.stack || err);
    process.exitCode = 1;
  } finally {
    if (pool) {
      await closePool().catch(() => {});
    }
  }
}

if (require.main === module) {
  checkModels();
}

module.exports = { checkModels };
