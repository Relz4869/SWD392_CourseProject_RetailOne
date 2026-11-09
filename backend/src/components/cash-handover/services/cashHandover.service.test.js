const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createCashHandoverService, DENOMINATIONS } = require('./cashHandover.service');

const cashier = { userId: 7, staffId: 17, role: 'Cashier' };
const zeroCounts = () => Object.fromEntries(DENOMINATIONS.map((value) => [String(value), 0]));

function harness(overrides = {}) {
  const state = overrides.state || { counted: false };
  const repository = {
    findCurrent: async (staffId) => ({
      stage: state.counted ? 'COUNTED' : 'BLIND_COUNT',
      scheduleId: 31,
      staffId,
      openingCash: '500000.00',
      shiftName: 'Ca sáng',
      workDate: '2026-11-09',
      startTime: '08:00:00',
      endTime: '16:00:00',
    }),
    acquireCountLock: async () => 0,
    insertCount: async () => {
      if (state.counted) return { outcome: 'ALREADY_COUNTED' };
      state.counted = true;
      return { outcome: 'OK', countId: 1, countedAt: new Date('2026-11-09T15:55:00') };
    },
    ...overrides.repository,
  };
  return createCashHandoverService({
    repository,
    withTransaction: overrides.withTransaction || (async (work) => work({})),
  });
}

test('BR-09 current blind-count response contains no reconciliation fields', async () => {
  const current = await harness().getCurrent(cashier);
  assert.equal(current.stage, 'BLIND_COUNT');
  for (const forbidden of ['expectedCash', 'systemCash', 'cashCollected', 'payouts', 'variance']) {
    assert.equal(Object.hasOwn(current, forbidden), false);
  }
});

test('UC82 recomputes actual cash exactly from all nine denominations', async () => {
  let inserted = null;
  const counts = zeroCounts();
  counts['500000'] = 2;
  counts['2000'] = 3;
  const service = harness({
    repository: {
      insertCount: async (payload) => {
        inserted = payload;
        return { outcome: 'OK', countId: 1, countedAt: new Date('2026-11-09T15:55:00') };
      },
    },
  });
  const result = await service.submitCount({ denominationCounts: counts }, cashier);
  assert.equal(inserted.actualCash, '1006000');
  assert.equal(result.actualCash, '1006000');
  for (const forbidden of ['expectedCash', 'systemCash', 'cashCollected', 'payouts', 'variance']) {
    assert.equal(Object.hasOwn(result, forbidden), false);
  }
});

test('UC82 rejects missing, foreign, negative and fractional denomination counts', async () => {
  const service = harness();
  const missing = zeroCounts();
  delete missing['1000'];
  await assert.rejects(service.submitCount({ denominationCounts: missing }, cashier), (error) => error.code === 'COUNT_INVALID');

  const foreign = { ...zeroCounts(), 100: 1 };
  await assert.rejects(service.submitCount({ denominationCounts: foreign }, cashier), (error) => error.code === 'COUNT_INVALID');

  const negative = zeroCounts();
  negative['5000'] = -1;
  await assert.rejects(service.submitCount({ denominationCounts: negative }, cashier), (error) => error.code === 'COUNT_INVALID');

  const fraction = zeroCounts();
  fraction['5000'] = 1.5;
  await assert.rejects(service.submitCount({ denominationCounts: fraction }, cashier), (error) => error.code === 'COUNT_INVALID');
});

test('UC82 rejects Manager/Warehouse and cashier override fields', async () => {
  const service = harness();
  await assert.rejects(service.getCurrent({ staffId: 2, role: 'Manager' }), (error) => error.code === 'CASHIER_ONLY');
  await assert.rejects(service.getCurrent({ staffId: 3, role: 'Warehouse Staff' }), (error) => error.code === 'CASHIER_ONLY');
  await assert.rejects(
    service.submitCount({ denominationCounts: zeroCounts(), override: true }, cashier),
    (error) => error.code === 'COUNT_INVALID',
  );
});

test('UC82 sealed count is idempotency-safe and cannot be overwritten', async () => {
  const state = { counted: false };
  const service = harness({ state });
  await service.submitCount({ denominationCounts: zeroCounts() }, cashier);
  await assert.rejects(
    service.submitCount({ denominationCounts: zeroCounts() }, cashier),
    (error) => error.code === 'COUNT_ALREADY_SEALED',
  );
});

test('BR-08 reconciliation and final confirm fail closed without Sales ledger contract', async () => {
  const service = harness();
  await assert.rejects(service.reconciliation(cashier), (error) => error.status === 503 && error.code === 'SALES_CASH_LEDGER_UNAVAILABLE');
  await assert.rejects(service.confirm({}, cashier), (error) => error.status === 503 && error.code === 'SALES_CASH_LEDGER_UNAVAILABLE');
  await assert.rejects(service.confirm({ override: true }, cashier), (error) => error.code === 'CASHIER_ONLY');
});

test('UC83 is Manager-only even when another role reaches the service', async () => {
  const service = harness({ repository: { findReport: async () => { throw new Error('must not query'); } } });
  await assert.rejects(
    service.getReport({ fromDate: '2026-11-01', toDate: '2026-11-30' }, cashier),
    (error) => error.status === 403 && error.code === 'REPORT_MANAGER_ONLY',
  );
});

test('UC83 validates inclusive date range and bounded pagination', async () => {
  const service = harness();
  const manager = { userId: 1, staffId: 1, role: 'Manager' };
  await assert.rejects(
    service.getReport({ fromDate: '2026-11-30', toDate: '2026-11-01' }, manager),
    (error) => error.code === 'REPORT_FILTER_INVALID',
  );
  await assert.rejects(
    service.getReport({ fromDate: '2026-11-01', toDate: '2026-11-30', pageSize: 101 }, manager),
    (error) => error.code === 'REPORT_FILTER_INVALID',
  );
  await assert.rejects(
    service.getReport({ fromDate: '2026-02-30', toDate: '2026-03-01' }, manager),
    (error) => error.code === 'REPORT_FILTER_INVALID',
  );
});

test('UC83 returns repository summary for the entire filter set, not the current page', async () => {
  let received = null;
  const service = harness({
    repository: {
      findReport: async (filters) => {
        received = filters;
        return {
          items: [{ id: 1 }], page: 2, pageSize: 1, totalItems: 3,
          summary: {
            totalHandovers: 3,
            signedTotalVariance: '0',
            averageSignedVariance: '0',
            absoluteTotalVariance: '10000',
            unreviewedDiscrepancies: 1,
          },
          staffOptions: [],
        };
      },
    },
  });
  const result = await service.getReport(
    { fromDate: '2026-11-01', toDate: '2026-11-30', staffId: 3, page: 2, pageSize: 1 },
    { role: 'Manager' },
  );
  assert.deepEqual(received, { fromDate: '2026-11-01', toDate: '2026-11-30', staffId: 3, page: 2, pageSize: 1 });
  assert.equal(result.items.length, 1);
  assert.equal(result.summary.totalHandovers, 3);
  assert.equal(result.totalPages, 3);
});

test('UC83 detail returns 404 when final handover does not exist', async () => {
  const service = harness({ repository: { findReportDetail: async () => null } });
  await assert.rejects(
    service.getReportDetail(999, { role: 'Manager' }),
    (error) => error.status === 404 && error.code === 'HANDOVER_NOT_FOUND',
  );
});
