const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getPool, closePool, sql } = require('../../../shared/config/database');
const scheduleService = require('./schedule.service');

const enabled = process.env.RUN_DB_INTEGRATION === '1';

test('UC81 SQL Server persistence and concurrent assignment guard', { skip: !enabled }, async (t) => {
  const pool = await getPool();
  let assignmentId = null;
  const workDate = '2099-12-30';

  try {
    const fixture = await pool.request().query(`
      SELECT TOP 1 s.id AS staffId, sh.id AS shiftId
      FROM dbo.Staff s
      JOIN dbo.Users u ON u.id = s.userId AND u.isActive = 'active'
      CROSS JOIN dbo.Shifts sh
      WHERE s.employmentStatus = 'working'
        AND sh.isActive = 1
        AND NOT EXISTS (
          SELECT 1 FROM dbo.WorkSchedules ws
          WHERE ws.staffId = s.id AND ws.workDate = '2099-12-30'
        )
      ORDER BY s.id, sh.id;
    `);

    if (!fixture.recordset[0]) {
      t.skip('Database has no active Staff/Shift pair available for the isolated test date');
      return;
    }

    const payload = {
      staffId: Number(fixture.recordset[0].staffId),
      shiftId: Number(fixture.recordset[0].shiftId),
      workDate,
    };
    const results = await Promise.allSettled([
      scheduleService.assignSchedule(payload),
      scheduleService.assignSchedule(payload),
    ]);

    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');
    assert.equal(fulfilled.length, 1);
    assert.equal(rejected.length, 1);
    assert.equal(rejected[0].reason.code, 'SCHEDULE_OVERLAP');
    assignmentId = fulfilled[0].value.assignmentId;

    const persisted = await pool.request()
      .input('assignmentId', sql.Int, assignmentId)
      .query(`
        SELECT id, staffId, shiftId, CONVERT(VARCHAR(10), workDate, 23) AS workDate, status
        FROM dbo.WorkSchedules
        WHERE id = @assignmentId;
      `);
    assert.equal(persisted.recordset.length, 1);
    assert.equal(persisted.recordset[0].workDate, workDate);
    assert.equal(persisted.recordset[0].status, 'assigned');
  } finally {
    if (assignmentId !== null) {
      await pool.request()
        .input('assignmentId', sql.Int, assignmentId)
        .input('workDate', sql.Date, workDate)
        .query(`
          DELETE FROM dbo.WorkSchedules
          WHERE id = @assignmentId AND workDate = @workDate;
        `);
    }
    await closePool();
  }
});
