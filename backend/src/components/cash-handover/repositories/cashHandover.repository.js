const { sql, request } = require('../../../shared/config/database');

function mapCurrent(row, denominations = []) {
  if (!row) return null;
  const counted = row.countId != null;
  return {
    stage: counted ? 'COUNTED' : 'BLIND_COUNT',
    scheduleId: Number(row.scheduleId),
    staffName: row.staffName,
    shiftName: row.shiftName,
    workDate: row.workDate,
    startTime: row.startTime,
    endTime: row.endTime,
    openingCash: row.openingCash == null ? null : String(row.openingCash),
    countedAt: counted ? row.countedAt : null,
    actualCash: counted ? String(row.actualCash) : undefined,
    denominationCounts: counted
      ? Object.fromEntries(denominations.map((item) => [String(item.denomination), item.quantity]))
      : undefined,
  };
}

async function findCurrent(staffId, tx) {
  const req = await request(tx);
  req.input('staffId', sql.BigInt, staffId);
  const result = await req.query(`
    SELECT TOP 1 ws.id AS scheduleId, st.fullName AS staffName, sh.name AS shiftName,
           CONVERT(VARCHAR(10), ws.workDate, 23) AS workDate,
           CONVERT(VARCHAR(8), sh.startTime, 108) AS startTime,
           CONVERT(VARCHAR(8), sh.endTime, 108) AS endTime,
           ws.openingCash, cc.id AS countId, cc.countedAt, cc.actualCash
    FROM dbo.WorkSchedules ws
    JOIN dbo.Staff st ON st.id = ws.staffId
    JOIN dbo.Shifts sh ON sh.id = ws.shiftId
    LEFT JOIN dbo.CashHandoverCounts cc ON cc.scheduleId = ws.id
    WHERE ws.staffId = @staffId
      AND ws.status = 'working'
      AND ws.workDate = CAST(SYSDATETIME() AS DATE)
      AND ws.checkInTime IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM dbo.CashHandovers ch WHERE ch.scheduleId = ws.id)
    ORDER BY ws.checkInTime DESC, ws.id DESC;
  `);
  const row = result.recordset && result.recordset[0];
  if (!row) return null;
  let denominations = [];
  if (row.countId != null) {
    const detailReq = await request(tx);
    detailReq.input('countId', sql.Int, row.countId);
    const details = await detailReq.query(`
      SELECT denomination, quantity
      FROM dbo.CashHandoverDenominations
      WHERE countId = @countId
      ORDER BY denomination DESC;
    `);
    denominations = details.recordset || [];
  }
  return mapCurrent(row, denominations);
}

async function acquireCountLock(scheduleId, tx) {
  const req = await request(tx);
  req.input('resource', sql.NVarChar(255), `uc82:count:${scheduleId}`);
  const result = await req.query(`
    DECLARE @result INT;
    EXEC @result = sys.sp_getapplock
      @Resource = @resource, @LockMode = 'Exclusive',
      @LockOwner = 'Transaction', @LockTimeout = 10000;
    SELECT @result AS lockResult;
  `);
  return Number(result.recordset[0].lockResult);
}

async function insertCount({ scheduleId, staffId, actualCash, denominationCounts }, tx) {
  const req = await request(tx);
  req.input('scheduleId', sql.Int, scheduleId);
  req.input('staffId', sql.BigInt, staffId);
  req.input('actualCash', sql.Decimal(15, 2), actualCash);
  const inserted = await req.query(`
    IF NOT EXISTS (
      SELECT 1 FROM dbo.WorkSchedules WITH (UPDLOCK, HOLDLOCK)
      WHERE id=@scheduleId AND staffId=@staffId AND status='working'
        AND workDate=CAST(SYSDATETIME() AS DATE) AND checkInTime IS NOT NULL
        AND openingCash IS NOT NULL
    ) BEGIN SELECT 'SESSION_NOT_FOUND' AS outcome; RETURN; END;
    IF EXISTS (SELECT 1 FROM dbo.CashHandovers WITH (UPDLOCK, HOLDLOCK) WHERE scheduleId=@scheduleId)
      BEGIN SELECT 'ALREADY_FINAL' AS outcome; RETURN; END;
    IF EXISTS (SELECT 1 FROM dbo.CashHandoverCounts WITH (UPDLOCK, HOLDLOCK) WHERE scheduleId=@scheduleId)
      BEGIN SELECT 'ALREADY_COUNTED' AS outcome; RETURN; END;

    INSERT INTO dbo.CashHandoverCounts(scheduleId, countedBy, actualCash)
    OUTPUT 'OK' AS outcome, INSERTED.id AS countId, INSERTED.countedAt
    VALUES(@scheduleId, @staffId, @actualCash);
  `);
  const row = inserted.recordset && inserted.recordset[0];
  if (!row || row.outcome !== 'OK') return { outcome: row ? row.outcome : 'SESSION_NOT_FOUND' };

  for (const [denomination, quantity] of Object.entries(denominationCounts)) {
    const detailReq = await request(tx);
    detailReq.input('countId', sql.Int, row.countId);
    detailReq.input('denomination', sql.Int, Number(denomination));
    detailReq.input('quantity', sql.Int, quantity);
    await detailReq.query(`
      INSERT INTO dbo.CashHandoverDenominations(countId, denomination, quantity)
      VALUES(@countId, @denomination, @quantity);
    `);
  }
  return { outcome: 'OK', countId: Number(row.countId), countedAt: row.countedAt };
}

function reportRow(row) {
  const variance = String(row.variance);
  const balanced = Number(row.variance) === 0;
  return {
    id: Number(row.id),
    scheduleId: Number(row.scheduleId),
    staffId: Number(row.staffId),
    staffName: row.staffName,
    shiftName: row.shiftName,
    workDate: row.workDate,
    handoverTime: row.handoverTime,
    expectedCash: String(row.expectedCash),
    actualCash: String(row.actualCash),
    variance,
    varianceStatus: balanced ? 'BALANCED' : 'DISCREPANCY_UNCLASSIFIED',
    severityConfigured: false,
    hasNote: Boolean(row.hasNote),
    reviewStatus: row.reviewStatus,
  };
}

function bindReportFilters(req, { fromDate, toDate, staffId, page, pageSize }) {
  req.input('fromDate', sql.VarChar(10), fromDate);
  req.input('toDate', sql.VarChar(10), toDate);
  req.input('staffId', sql.BigInt, staffId || null);
  req.input('offset', sql.Int, (page - 1) * pageSize);
  req.input('pageSize', sql.Int, pageSize);
  return req;
}

async function findReport(filters, tx) {
  const req = bindReportFilters(await request(tx), filters);
  const result = await req.query(`
    SELECT h.id, h.scheduleId, ws.staffId, st.fullName AS staffName, sh.name AS shiftName,
           CONVERT(VARCHAR(10), ws.workDate, 23) AS workDate, h.handoverTime,
           CAST(h.openingCash + h.systemCash AS DECIMAL(15,2)) AS expectedCash,
           h.actualCash, h.difference AS variance,
           CAST(CASE WHEN NULLIF(LTRIM(RTRIM(h.note)), '') IS NULL THEN 0 ELSE 1 END AS BIT) AS hasNote,
           h.reviewStatus
    FROM dbo.CashHandovers h
    JOIN dbo.WorkSchedules ws ON ws.id=h.scheduleId
    JOIN dbo.Staff st ON st.id=ws.staffId
    JOIN dbo.Shifts sh ON sh.id=ws.shiftId
    WHERE h.handoverTime >= CAST(@fromDate AS DATETIME2)
      AND h.handoverTime < DATEADD(DAY,1,CAST(@toDate AS DATETIME2))
      AND (@staffId IS NULL OR ws.staffId=@staffId)
    ORDER BY h.handoverTime DESC, h.id DESC
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;

    SELECT COUNT_BIG(*) AS totalHandovers,
           COALESCE(SUM(CAST(h.difference AS DECIMAL(38,2))),0) AS signedTotalVariance,
           COALESCE(AVG(CAST(h.difference AS DECIMAL(38,2))),0) AS averageSignedVariance,
           COALESCE(SUM(ABS(CAST(h.difference AS DECIMAL(38,2)))),0) AS absoluteTotalVariance,
           SUM(CASE WHEN h.difference<>0 AND h.reviewStatus='Pending' THEN 1 ELSE 0 END) AS unreviewedDiscrepancies
    FROM dbo.CashHandovers h
    JOIN dbo.WorkSchedules ws ON ws.id=h.scheduleId
    WHERE h.handoverTime >= CAST(@fromDate AS DATETIME2)
      AND h.handoverTime < DATEADD(DAY,1,CAST(@toDate AS DATETIME2))
      AND (@staffId IS NULL OR ws.staffId=@staffId);

    SELECT DISTINCT st.id, st.fullName
    FROM dbo.CashHandovers h
    JOIN dbo.WorkSchedules ws ON ws.id=h.scheduleId
    JOIN dbo.Staff st ON st.id=ws.staffId
    ORDER BY st.fullName, st.id;
  `);
  const summary = result.recordsets[1][0];
  return {
    items: (result.recordsets[0] || []).map(reportRow),
    page: filters.page,
    pageSize: filters.pageSize,
    totalItems: Number(summary.totalHandovers),
    summary: {
      totalHandovers: Number(summary.totalHandovers),
      signedTotalVariance: String(summary.signedTotalVariance),
      averageSignedVariance: String(summary.averageSignedVariance),
      absoluteTotalVariance: String(summary.absoluteTotalVariance),
      unreviewedDiscrepancies: Number(summary.unreviewedDiscrepancies || 0),
    },
    staffOptions: (result.recordsets[2] || []).map((row) => ({ id: Number(row.id), fullName: row.fullName })),
  };
}

async function findReportDetail(id, tx) {
  const req = await request(tx);
  req.input('id', sql.Int, id);
  const result = await req.query(`
    SELECT h.id, h.scheduleId, ws.staffId, st.fullName AS staffName, sh.name AS shiftName,
           CONVERT(VARCHAR(10), ws.workDate, 23) AS workDate,
           CONVERT(VARCHAR(8), sh.startTime, 108) AS startTime,
           CONVERT(VARCHAR(8), sh.endTime, 108) AS endTime,
           ws.checkInTime, ws.checkOutTime, h.handoverTime,
           h.openingCash, h.systemCash,
           CAST(h.openingCash + h.systemCash AS DECIMAL(15,2)) AS expectedCash,
           h.actualCash, h.difference AS variance, h.note,
           CAST(CASE WHEN NULLIF(LTRIM(RTRIM(h.note)), '') IS NULL THEN 0 ELSE 1 END AS BIT) AS hasNote,
           h.reviewStatus, h.reviewedBy, reviewer.fullName AS reviewedByName,
           h.reviewedAt, h.reviewNote
    FROM dbo.CashHandovers h
    JOIN dbo.WorkSchedules ws ON ws.id=h.scheduleId
    JOIN dbo.Staff st ON st.id=ws.staffId
    JOIN dbo.Shifts sh ON sh.id=ws.shiftId
    LEFT JOIN dbo.Staff reviewer ON reviewer.id=h.reviewedBy
    WHERE h.id=@id;

    SELECT d.denomination, d.quantity, d.subtotal
    FROM dbo.CashHandovers h
    JOIN dbo.CashHandoverCounts c ON c.scheduleId=h.scheduleId
    JOIN dbo.CashHandoverDenominations d ON d.countId=c.id
    WHERE h.id=@id
    ORDER BY d.denomination DESC;
  `);
  const row = result.recordsets[0][0];
  if (!row) return null;
  return {
    ...reportRow(row),
    startTime: row.startTime,
    endTime: row.endTime,
    checkInTime: row.checkInTime,
    checkOutTime: row.checkOutTime,
    openingCash: String(row.openingCash),
    systemCash: String(row.systemCash),
    note: row.note,
    reviewedBy: row.reviewedBy == null ? null : Number(row.reviewedBy),
    reviewedByName: row.reviewedByName,
    reviewedAt: row.reviewedAt,
    reviewNote: row.reviewNote,
    denominations: (result.recordsets[1] || []).map((item) => ({
      denomination: Number(item.denomination),
      quantity: Number(item.quantity),
      subtotal: String(item.subtotal),
    })),
  };
}

module.exports = { findCurrent, acquireCountLock, insertCount, findReport, findReportDetail };
