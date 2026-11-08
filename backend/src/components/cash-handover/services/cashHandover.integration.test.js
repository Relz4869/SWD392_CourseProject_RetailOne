const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getPool, closePool, sql } = require('../../../shared/config/database');
const service = require('./cashHandover.service');

const enabled = process.env.RUN_DB_INTEGRATION === '1';

test('UC82 SQL Server blind count persistence, no leak and concurrency', { skip: !enabled }, async (t) => {
  const pool = await getPool();
  let shiftId = null;
  let scheduleId = null;
  try {
    const actorResult = await pool.request().query(`
      SELECT TOP 1 s.id AS staffId
      FROM dbo.Staff s
      JOIN dbo.Users u ON u.id=s.userId AND u.isActive='active'
      JOIN dbo.Roles r ON r.id=u.roleId AND r.name='Cashier'
      WHERE s.employmentStatus='working'
      ORDER BY s.id;
    `);
    if (!actorResult.recordset[0]) {
      t.skip('No active Cashier available for UC82 integration fixture');
      return;
    }
    const staffId = Number(actorResult.recordset[0].staffId);
    const shift = await pool.request()
      .input('name', sql.NVarChar(50), `UC82-IT-${Date.now()}`)
      .query(`
        INSERT INTO dbo.Shifts(name,startTime,endTime,checkInStart,checkInEnd,checkOutDeadline,isActive)
        OUTPUT INSERTED.id VALUES(@name,'00:01','23:58','00:00','23:59','23:59',1);
      `);
    shiftId = shift.recordset[0].id;
    const schedule = await pool.request()
      .input('staffId', sql.BigInt, staffId)
      .input('shiftId', sql.Int, shiftId)
      .query(`
        INSERT INTO dbo.WorkSchedules(staffId,shiftId,workDate,checkInTime,status,openingCash)
        OUTPUT INSERTED.id
        VALUES(@staffId,@shiftId,CAST(SYSDATETIME() AS DATE),DATEADD(SECOND,30,SYSDATETIME()),'working',500000);
      `);
    scheduleId = schedule.recordset[0].id;
    const user = { userId: 1, staffId, role: 'Cashier' };
    const before = await service.getCurrent(user);
    assert.equal(before.stage, 'BLIND_COUNT');
    for (const key of ['expectedCash', 'systemCash', 'cashCollected', 'payouts', 'variance']) {
      assert.equal(Object.hasOwn(before, key), false);
    }

    const counts = Object.fromEntries(service.DENOMINATIONS.map((value) => [String(value), value === 500000 ? 1 : 0]));
    const concurrent = await Promise.allSettled([
      service.submitCount({ denominationCounts: counts }, user),
      service.submitCount({ denominationCounts: counts }, user),
    ]);
    assert.equal(concurrent.filter((item) => item.status === 'fulfilled').length, 1);
    assert.equal(concurrent.find((item) => item.status === 'rejected').reason.code, 'COUNT_ALREADY_SEALED');

    const persisted = await pool.request().input('scheduleId', sql.Int, scheduleId).query(`
      SELECT c.actualCash, COUNT(d.id) AS denominationRows
      FROM dbo.CashHandoverCounts c
      JOIN dbo.CashHandoverDenominations d ON d.countId=c.id
      WHERE c.scheduleId=@scheduleId
      GROUP BY c.actualCash;
    `);
    assert.equal(Number(persisted.recordset[0].actualCash), 500000);
    assert.equal(persisted.recordset[0].denominationRows, 9);

    const after = await service.getCurrent(user);
    assert.equal(after.stage, 'COUNTED');
    assert.equal(after.actualCash, '500000');
    assert.equal(Object.hasOwn(after, 'expectedCash'), false);
  } finally {
    if (scheduleId !== null) {
      await pool.request().input('scheduleId', sql.Int, scheduleId)
        .query('DELETE FROM dbo.CashHandoverCounts WHERE scheduleId=@scheduleId; DELETE FROM dbo.WorkSchedules WHERE id=@scheduleId;');
    }
    if (shiftId !== null) {
      await pool.request().input('shiftId', sql.Int, shiftId).query('DELETE FROM dbo.Shifts WHERE id=@shiftId;');
    }
    await closePool();
  }
});
