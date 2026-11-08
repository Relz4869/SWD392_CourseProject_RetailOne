const sql = require('mssql');
const { db } = require('./env');

let poolPromise = null;

function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(db).connect().catch((err) => {
      poolPromise = null;
      throw err;
    });
  }
  return poolPromise;
}

/** New request, bound to the transaction if tx is given. */
async function request(tx) {
  if (tx) return new sql.Request(tx);
  return (await getPool()).request();
}

/** Run work(tx) in one transaction. */
async function withTransaction(work) {
  const tx = new sql.Transaction(await getPool());
  await tx.begin();
  try {
    const result = await work(tx);
    await tx.commit();
    return result;
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

/** Close the pool (used by scripts so the process can exit). */
async function closePool() {
  if (!poolPromise) return;
  const pool = await poolPromise.catch(() => null);
  poolPromise = null;
  if (pool) await pool.close();
}

module.exports = { sql, getPool, request, withTransaction, closePool };

