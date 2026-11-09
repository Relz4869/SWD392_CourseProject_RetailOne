const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getPool, closePool, sql } = require('../../../shared/config/database');
const shiftService = require('./shift.service');

const enabled = process.env.RUN_DB_INTEGRATION === '1';

test('UC75 SQL Server persistence, invalid time and concurrent duplicate guard', { skip: !enabled }, async () => {
  const pool = await getPool();
  const name = `IT-Shift-${Date.now()}`;

  try {
    await assert.rejects(
      shiftService.createShift({ name: `${name}-invalid`, startTime: '16:00', endTime: '08:00' }),
      (error) => error.code === 'INVALID_TIME_RANGE',
    );

    const payload = {
      name,
      startTime: '08:00',
      endTime: '16:00',
      checkInStart: '07:45',
      checkInEnd: '08:15',
      checkOutDeadline: '16:30',
      isActive: true,
    };
    const results = await Promise.allSettled([
      shiftService.createShift(payload),
      shiftService.createShift({ ...payload, name: `  ${name.toUpperCase()}  ` }),
    ]);
    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');
    assert.equal(fulfilled.length, 1);
    assert.equal(rejected.length, 1);
    assert.equal(rejected[0].reason.code, 'DUPLICATE_SHIFT_NAME');

    const persisted = await pool.request()
      .input('name', sql.NVarChar(50), name)
      .query(`
        SELECT name, CONVERT(VARCHAR(5), startTime, 108) AS startTime,
               CONVERT(VARCHAR(5), endTime, 108) AS endTime,
               CONVERT(VARCHAR(5), checkInStart, 108) AS checkInStart,
               CONVERT(VARCHAR(5), checkInEnd, 108) AS checkInEnd,
               CONVERT(VARCHAR(5), checkOutDeadline, 108) AS checkOutDeadline,
               isActive
        FROM dbo.Shifts
        WHERE LOWER(LTRIM(RTRIM(name)))=LOWER(LTRIM(RTRIM(@name)));
      `);
    assert.equal(persisted.recordset.length, 1);
    assert.equal(persisted.recordset[0].name.toLocaleLowerCase(), name.toLocaleLowerCase());
    assert.deepEqual(
      { ...persisted.recordset[0], name: undefined, isActive: Boolean(persisted.recordset[0].isActive) },
      {
        name: undefined,
        startTime: '08:00',
        endTime: '16:00',
        checkInStart: '07:45',
        checkInEnd: '08:15',
        checkOutDeadline: '16:30',
        isActive: true,
      },
    );
  } finally {
    await pool.request()
      .input('name', sql.NVarChar(50), name)
      .input('invalidName', sql.NVarChar(50), `${name}-invalid`)
      .query(`
        DELETE FROM dbo.Shifts
        WHERE LOWER(LTRIM(RTRIM(name))) IN (
          LOWER(LTRIM(RTRIM(@name))), LOWER(LTRIM(RTRIM(@invalidName)))
        );
      `);
    await closePool();
  }
});
