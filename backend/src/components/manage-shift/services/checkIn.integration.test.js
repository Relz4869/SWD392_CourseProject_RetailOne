const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getPool, closePool, sql } = require('../../../shared/config/database');
const scheduleService = require('./schedule.service');

const enabled = process.env.RUN_DB_INTEGRATION === '1';

test('UC73 SQL Server atomic Cashier/Warehouse check-in and concurrency', { skip: !enabled }, async (t) => {
  const pool = await getPool();
  const workDate = '2099-12-29';
  const now = new Date('2099-12-29T08:15:00');
  let shiftId = null;
  const scheduleIds = [];

  try {
    const actors = await pool.request().query(`
      SELECT r.name AS role, s.id AS staffId
      FROM dbo.Staff s
      JOIN dbo.Users u ON u.id = s.userId AND u.isActive = 'active'
      JOIN dbo.Roles r ON r.id = u.roleId
      WHERE s.employmentStatus = 'working'
        AND r.name IN ('Cashier', 'Warehouse Staff')
        AND NOT EXISTS (SELECT 1 FROM dbo.WorkSchedules w WHERE w.staffId=s.id AND w.status='working')
      ORDER BY s.id;
    `);
    const cashier = actors.recordset.find((item) => item.role === 'Cashier');
    const warehouse = actors.recordset.find((item) => item.role === 'Warehouse Staff');
    if (!cashier || !warehouse) {
      t.skip('No inactive-session Cashier/Warehouse pair is available for integration fixtures');
      return;
    }

    const shiftResult = await pool.request()
      .input('name', sql.NVarChar(50), `UC73-IT-${Date.now()}`)
      .query(`
        INSERT INTO dbo.Shifts(name,startTime,endTime,checkInStart,checkInEnd,checkOutDeadline,isActive)
        OUTPUT INSERTED.id
        VALUES(@name,'08:00','16:00','07:30','09:00','17:00',1);
      `);
    shiftId = shiftResult.recordset[0].id;

    for (const actor of [cashier, warehouse]) {
      const inserted = await pool.request()
        .input('staffId', sql.BigInt, actor.staffId)
        .input('shiftId', sql.Int, shiftId)
        .input('workDate', sql.Date, workDate)
        .query(`
          INSERT INTO dbo.WorkSchedules(staffId,shiftId,workDate,status)
          OUTPUT INSERTED.id
          VALUES(@staffId,@shiftId,@workDate,'assigned');
        `);
      scheduleIds.push(inserted.recordset[0].id);
    }

    const cashierUser = { staffId: Number(cashier.staffId), role: 'Cashier' };
    await assert.rejects(
      scheduleService.checkIn(scheduleIds[0], {}, cashierUser, { now }),
      (error) => error.code === 'OPENING_CASH_REQUIRED',
    );

    await assert.rejects(
      scheduleService.checkIn(scheduleIds[1], { openingCash: 0 }, cashierUser, { now }),
      (error) => error.code === 'SCHEDULE_NOT_FOUND',
    );

    const concurrent = await Promise.allSettled([
      scheduleService.checkIn(scheduleIds[0], { openingCash: 0 }, cashierUser, { now }),
      scheduleService.checkIn(scheduleIds[0], { openingCash: 0 }, cashierUser, { now }),
    ]);
    assert.equal(concurrent.filter((item) => item.status === 'fulfilled').length, 1);
    assert.equal(concurrent.find((item) => item.status === 'rejected').reason.code, 'ALREADY_CHECKED_IN');
    const cashierSession = concurrent.find((item) => item.status === 'fulfilled').value;
    assert.equal(cashierSession.attendanceRecord, 'Late');
    assert.equal(cashierSession.lateMinutes, 15);
    assert.equal(cashierSession.openingCash, '0');

    const warehouseSession = await scheduleService.checkIn(
      scheduleIds[1],
      {},
      { staffId: Number(warehouse.staffId), role: 'Warehouse Staff' },
      { now },
    );
    assert.equal(warehouseSession.status, 'working');
    assert.equal(warehouseSession.openingCash, null);

    const persisted = await pool.request()
      .input('cashierScheduleId', sql.Int, scheduleIds[0])
      .input('warehouseScheduleId', sql.Int, scheduleIds[1])
      .query(`
        SELECT id,status,attendanceRecord,openingCash,penaltyAmount,checkInTime
        FROM dbo.WorkSchedules
        WHERE id IN (@cashierScheduleId,@warehouseScheduleId)
        ORDER BY id;
      `);
    assert.equal(persisted.recordset.length, 2);
    assert.ok(persisted.recordset.every((item) => item.status === 'working' && item.checkInTime));
    assert.ok(persisted.recordset.every((item) => Number(item.penaltyAmount) === 0));
  } finally {
    if (scheduleIds.length > 0) {
      const cleanup = pool.request();
      scheduleIds.forEach((id, index) => cleanup.input(`id${index}`, sql.Int, id));
      const params = scheduleIds.map((_, index) => `@id${index}`).join(',');
      await cleanup.query(`DELETE FROM dbo.WorkSchedules WHERE id IN (${params});`);
    }
    if (shiftId !== null) {
      await pool.request().input('shiftId', sql.Int, shiftId)
        .query('DELETE FROM dbo.Shifts WHERE id=@shiftId;');
    }
    await closePool();
  }
});
