const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getPool, closePool } = require('../../../shared/config/database');
const service = require('./cashHandover.service');

const enabled = process.env.RUN_DB_INTEGRATION === '1';

test('UC83 SQL report uses final handovers, full-filter summary, staff filter and detail', { skip: !enabled }, async (t) => {
  const pool = await getPool();
  try {
    const dbCount = await pool.request().query('SELECT COUNT(*) AS total FROM dbo.CashHandovers;');
    const expectedTotal = Number(dbCount.recordset[0].total);
    if (expectedTotal === 0) {
      t.skip('No final CashHandovers available for report integration');
      return;
    }
    const manager = { userId: 1, staffId: 1, role: 'Manager' };
    const report = await service.getReport({
      fromDate: '2000-01-01', toDate: '2099-12-31', page: 1, pageSize: 1,
    }, manager);
    assert.equal(report.items.length, 1);
    assert.equal(report.totalItems, expectedTotal);
    assert.equal(report.summary.totalHandovers, expectedTotal);
    assert.ok(report.staffOptions.length > 0);

    const selected = report.items[0];
    assert.ok(['BALANCED', 'DISCREPANCY_UNCLASSIFIED'].includes(selected.varianceStatus));
    assert.equal(selected.severityConfigured, false);
    const filtered = await service.getReport({
      fromDate: '2000-01-01', toDate: '2099-12-31', staffId: selected.staffId, page: 1, pageSize: 100,
    }, manager);
    assert.ok(filtered.items.every((item) => item.staffId === selected.staffId));

    const detail = await service.getReportDetail(selected.id, manager);
    assert.equal(detail.id, selected.id);
    assert.equal(detail.scheduleId, selected.scheduleId);
    assert.ok(Array.isArray(detail.denominations));
  } finally {
    await closePool();
  }
});
