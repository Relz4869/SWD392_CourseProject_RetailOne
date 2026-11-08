// Owner: HiepND | UC81, UC73
const { request, sql } = require('../../../shared/config/database');
const WorkSchedule = require('../models/workSchedule.model');

function fromScheduleRow(row) {
  const schedule = WorkSchedule.fromRow(row);
  schedule.staffName = row.staffName;
  schedule.shiftName = row.shiftName;
  schedule.startTime = row.startTime;
  schedule.endTime = row.endTime;
  return schedule;
}

async function findInRange({ from, to, staffId }, tx) {
  const req = await request(tx);
  req.input('from', sql.Date, from);
  req.input('to', sql.Date, to);
  req.input('staffId', sql.BigInt, staffId ?? null);
  const result = await req.query(`
    SELECT ws.id, ws.staffId, ws.shiftId,
           CONVERT(VARCHAR(10), ws.workDate, 23) AS workDate,
           ws.checkInTime, ws.checkOutTime, ws.workedHours, ws.status, ws.note,
           ws.attendanceRecord, ws.penaltyAmount, ws.openingCash,
           s.fullName AS staffName, sh.name AS shiftName,
           CONVERT(VARCHAR(8), sh.startTime, 108) AS startTime,
           CONVERT(VARCHAR(8), sh.endTime, 108) AS endTime
    FROM dbo.WorkSchedules ws
    JOIN dbo.Staff s ON s.id = ws.staffId
    JOIN dbo.Shifts sh ON sh.id = ws.shiftId
    WHERE ws.workDate BETWEEN @from AND @to
      AND (@staffId IS NULL OR ws.staffId = @staffId)
    ORDER BY ws.workDate, sh.startTime, s.fullName, ws.id;
  `);
  return (result.recordset || []).map(fromScheduleRow);
}

async function acquireAssignmentLock(staffId, workDate, tx) {
  const req = await request(tx);
  req.input('lockResource', sql.NVarChar(255), `uc81:staff:${staffId}:date:${workDate}`);
  const result = await req.query(`
    DECLARE @lockResult INT;
    EXEC @lockResult = sys.sp_getapplock
      @Resource = @lockResource,
      @LockMode = 'Exclusive',
      @LockOwner = 'Transaction',
      @LockTimeout = 10000;
    SELECT @lockResult AS lockResult;
  `);
  return result.recordset && result.recordset[0]
    ? Number(result.recordset[0].lockResult)
    : -999;
}

async function findOverlap({ staffId, workDate, startTime, endTime }, tx) {
  const req = await request(tx);
  req.input('staffId', sql.BigInt, staffId);
  req.input('workDate', sql.Date, workDate);
  req.input('startTime', sql.VarChar(8), startTime);
  req.input('endTime', sql.VarChar(8), endTime);
  const result = await req.query(`
    SELECT TOP 1 ws.id, ws.staffId, ws.shiftId,
           CONVERT(VARCHAR(10), ws.workDate, 23) AS workDate,
           ws.checkInTime, ws.checkOutTime, ws.workedHours, ws.status, ws.note,
           ws.attendanceRecord, ws.penaltyAmount, ws.openingCash,
           s.fullName AS staffName, sh.name AS shiftName,
           CONVERT(VARCHAR(8), sh.startTime, 108) AS startTime,
           CONVERT(VARCHAR(8), sh.endTime, 108) AS endTime
    FROM dbo.WorkSchedules ws WITH (UPDLOCK, HOLDLOCK)
    JOIN dbo.Staff s ON s.id = ws.staffId
    JOIN dbo.Shifts sh ON sh.id = ws.shiftId
    WHERE ws.staffId = @staffId
      AND ws.workDate = @workDate
      AND sh.startTime < CAST(@endTime AS TIME)
      AND CAST(@startTime AS TIME) < sh.endTime
    ORDER BY sh.startTime, ws.id;
  `);
  return result.recordset && result.recordset[0]
    ? fromScheduleRow(result.recordset[0])
    : null;
}

async function sumScheduledHours(staffId, from, to, tx) {
  const req = await request(tx);
  req.input('staffId', sql.BigInt, staffId);
  req.input('from', sql.Date, from);
  req.input('to', sql.Date, to);
  const result = await req.query(`
    SELECT COALESCE(SUM(DATEDIFF(SECOND, sh.startTime, sh.endTime) / 3600.0), 0) AS totalHours
    FROM dbo.WorkSchedules ws
    JOIN dbo.Shifts sh ON sh.id = ws.shiftId
    WHERE ws.staffId = @staffId
      AND ws.workDate BETWEEN @from AND @to;
  `);
  return Number(result.recordset[0].totalHours || 0);
}

async function insert(schedule, tx) {
  const req = await request(tx);
  req.input('staffId', sql.BigInt, schedule.staffId);
  req.input('shiftId', sql.Int, schedule.shiftId);
  req.input('workDate', sql.Date, schedule.workDate);
  req.input('status', sql.VarChar(20), schedule.status || WorkSchedule.STATUS.ASSIGNED);
  const result = await req.query(`
    INSERT INTO dbo.WorkSchedules (staffId, shiftId, workDate, status)
    OUTPUT INSERTED.id, INSERTED.staffId, INSERTED.shiftId,
           CONVERT(VARCHAR(10), INSERTED.workDate, 23) AS workDate,
           INSERTED.checkInTime, INSERTED.checkOutTime, INSERTED.workedHours,
           INSERTED.status, INSERTED.note, INSERTED.attendanceRecord,
           INSERTED.penaltyAmount, INSERTED.openingCash
    VALUES (@staffId, @shiftId, @workDate, @status);
  `);
  return WorkSchedule.fromRow(result.recordset[0]);
}

function sessionFromRow(row) {
  if (!row) return null;
  return {
    scheduleId: Number(row.scheduleId),
    workingSessionId: Number(row.scheduleId),
    staffId: Number(row.staffId),
    shiftId: Number(row.shiftId),
    shiftName: row.shiftName,
    workDate: row.workDate,
    startTime: row.startTime,
    endTime: row.endTime,
    checkInStart: row.checkInStart,
    checkInEnd: row.checkInEnd,
    checkOutDeadline: row.checkOutDeadline,
    actualCheckInAt: row.actualCheckInAt,
    status: row.status,
    attendanceRecord: row.attendanceRecord,
    lateMinutes: row.lateMinutes == null ? null : Number(row.lateMinutes),
    openingCash: row.openingCash == null ? null : String(row.openingCash),
    canCheckIn: row.canCheckIn === undefined ? undefined : Boolean(row.canCheckIn),
  };
}

async function findMyTodayState(staffId, now = null, tx) {
  const req = await request(tx);
  req.input('staffId', sql.BigInt, staffId);
  req.input('now', sql.DateTime2, now);
  const result = await req.query(`
    DECLARE @current DATETIME2(7) = COALESCE(@now, SYSDATETIME());

    SELECT ws.id AS scheduleId, ws.staffId, ws.shiftId, sh.name AS shiftName,
           CONVERT(VARCHAR(10), ws.workDate, 23) AS workDate,
           CONVERT(VARCHAR(8), sh.startTime, 108) AS startTime,
           CONVERT(VARCHAR(8), sh.endTime, 108) AS endTime,
           CONVERT(VARCHAR(8), COALESCE(sh.checkInStart, sh.startTime), 108) AS checkInStart,
           CONVERT(VARCHAR(8), COALESCE(sh.checkInEnd, sh.endTime), 108) AS checkInEnd,
           CONVERT(VARCHAR(8), sh.checkOutDeadline, 108) AS checkOutDeadline,
           ws.checkInTime AS actualCheckInAt, ws.status, ws.attendanceRecord, ws.openingCash,
           CASE WHEN ws.checkInTime IS NOT NULL AND CAST(ws.checkInTime AS TIME) > sh.startTime
                THEN DATEDIFF(MINUTE, sh.startTime, CAST(ws.checkInTime AS TIME)) ELSE 0 END AS lateMinutes,
           CASE WHEN ws.status = 'assigned'
                     AND CAST(@current AS TIME) BETWEEN COALESCE(sh.checkInStart, sh.startTime)
                                                    AND COALESCE(sh.checkInEnd, sh.endTime)
                THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS canCheckIn
    FROM dbo.WorkSchedules ws
    JOIN dbo.Shifts sh ON sh.id = ws.shiftId
    WHERE ws.staffId = @staffId
      AND ws.workDate = CAST(@current AS DATE)
      AND ws.status IN ('assigned', 'working')
      AND sh.isActive = 1
    ORDER BY sh.startTime, ws.id;
  `);
  const sessions = (result.recordset || []).map(sessionFromRow);
  return {
    activeSession: sessions.find((item) => item.status === WorkSchedule.STATUS.WORKING) || null,
    pendingShifts: sessions.filter((item) => item.status === WorkSchedule.STATUS.ASSIGNED),
  };
}

async function acquireCheckInLock(scheduleId, tx) {
  const req = await request(tx);
  req.input('lockResource', sql.NVarChar(255), `uc73:schedule:${scheduleId}`);
  const result = await req.query(`
    DECLARE @lockResult INT;
    EXEC @lockResult = sys.sp_getapplock
      @Resource = @lockResource,
      @LockMode = 'Exclusive',
      @LockOwner = 'Transaction',
      @LockTimeout = 10000;
    SELECT @lockResult AS lockResult;
  `);
  return result.recordset && result.recordset[0]
    ? Number(result.recordset[0].lockResult)
    : -999;
}

async function checkInAtomic({ scheduleId, staffId, openingCash, now = null }, tx) {
  const req = await request(tx);
  req.input('scheduleId', sql.Int, scheduleId);
  req.input('staffId', sql.BigInt, staffId);
  req.input('openingCash', sql.Decimal(15, 2), openingCash);
  req.input('now', sql.DateTime2, now);
  const result = await req.query(`
    SET NOCOUNT ON;
    DECLARE @current DATETIME2(7) = COALESCE(@now, SYSDATETIME());
    DECLARE @status VARCHAR(20), @workDate DATE, @startTime TIME(7), @checkInStart TIME(7),
            @checkInEnd TIME(7), @isActive BIT;

    SELECT @status = ws.status, @workDate = ws.workDate, @startTime = sh.startTime,
           @checkInStart = COALESCE(sh.checkInStart, sh.startTime),
           @checkInEnd = COALESCE(sh.checkInEnd, sh.endTime), @isActive = sh.isActive
    FROM dbo.WorkSchedules ws WITH (UPDLOCK, HOLDLOCK)
    JOIN dbo.Shifts sh ON sh.id = ws.shiftId
    WHERE ws.id = @scheduleId AND ws.staffId = @staffId;

    IF @status IS NULL BEGIN SELECT 'NOT_FOUND' AS outcome; RETURN; END;
    IF @status <> 'assigned' BEGIN SELECT 'ALREADY_CHECKED_IN' AS outcome; RETURN; END;
    IF @isActive <> 1 OR @workDate <> CAST(@current AS DATE)
      BEGIN SELECT 'NOT_FOUND' AS outcome; RETURN; END;
    IF CAST(@current AS TIME) < @checkInStart OR CAST(@current AS TIME) > @checkInEnd
      BEGIN SELECT 'WINDOW_CLOSED' AS outcome; RETURN; END;
    IF EXISTS (
      SELECT 1 FROM dbo.WorkSchedules WITH (UPDLOCK, HOLDLOCK)
      WHERE staffId = @staffId AND status = 'working' AND id <> @scheduleId
    ) BEGIN SELECT 'ACTIVE_SESSION_EXISTS' AS outcome; RETURN; END;

    UPDATE dbo.WorkSchedules
    SET checkInTime = @current,
        status = 'working',
        attendanceRecord = CASE WHEN CAST(@current AS TIME) > @startTime THEN 'Late' ELSE 'OnTime' END,
        openingCash = @openingCash
    WHERE id = @scheduleId AND staffId = @staffId AND status = 'assigned';

    SELECT 'OK' AS outcome, ws.id AS scheduleId, ws.staffId, ws.shiftId, sh.name AS shiftName,
           CONVERT(VARCHAR(10), ws.workDate, 23) AS workDate,
           CONVERT(VARCHAR(8), sh.startTime, 108) AS startTime,
           CONVERT(VARCHAR(8), sh.endTime, 108) AS endTime,
           CONVERT(VARCHAR(8), COALESCE(sh.checkInStart, sh.startTime), 108) AS checkInStart,
           CONVERT(VARCHAR(8), COALESCE(sh.checkInEnd, sh.endTime), 108) AS checkInEnd,
           CONVERT(VARCHAR(8), sh.checkOutDeadline, 108) AS checkOutDeadline,
           ws.checkInTime AS actualCheckInAt, ws.status, ws.attendanceRecord, ws.openingCash,
           CASE WHEN CAST(ws.checkInTime AS TIME) > sh.startTime
                THEN DATEDIFF(MINUTE, sh.startTime, CAST(ws.checkInTime AS TIME)) ELSE 0 END AS lateMinutes
    FROM dbo.WorkSchedules ws
    JOIN dbo.Shifts sh ON sh.id = ws.shiftId
    WHERE ws.id = @scheduleId;
  `);
  const row = result.recordset && result.recordset[0];
  return {
    outcome: row ? row.outcome : 'NOT_FOUND',
    session: row && row.outcome === 'OK' ? sessionFromRow(row) : null,
  };
}

async function findActiveSalesSession(staffId, tx) {
  const req = await request(tx);
  req.input('staffId', sql.BigInt, staffId);
  const result = await req.query(`
    SELECT TOP 1 ws.id AS scheduleId, ws.staffId, ws.shiftId, sh.name AS shiftName,
           CONVERT(VARCHAR(10), ws.workDate, 23) AS workDate,
           CONVERT(VARCHAR(8), sh.startTime, 108) AS startTime,
           CONVERT(VARCHAR(8), sh.endTime, 108) AS endTime,
           ws.checkInTime AS actualCheckInAt, ws.status, ws.attendanceRecord, ws.openingCash,
           CAST(NULL AS INT) AS lateMinutes
    FROM dbo.WorkSchedules ws
    JOIN dbo.Shifts sh ON sh.id = ws.shiftId
    WHERE ws.staffId = @staffId
      AND ws.status = 'working'
      AND ws.workDate = CAST(SYSDATETIME() AS DATE)
      AND ws.checkInTime IS NOT NULL
      AND ws.openingCash IS NOT NULL
      AND sh.isActive = 1
    ORDER BY ws.checkInTime DESC, ws.id DESC;
  `);
  return result.recordset && result.recordset[0] ? sessionFromRow(result.recordset[0]) : null;
}

module.exports = {
  findInRange,
  acquireAssignmentLock,
  findOverlap,
  sumScheduledHours,
  insert,
  findMyTodayState,
  acquireCheckInLock,
  checkInAtomic,
  findActiveSalesSession,
};

