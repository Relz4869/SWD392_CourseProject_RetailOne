const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createScheduleService, _private } = require('./schedule.service');

function staff(overrides = {}) {
  return {
    id: 10,
    fullName: 'Nhân viên test',
    employmentStatus: 'working',
    accountStatus: 'active',
    isWorking() { return this.employmentStatus === 'working'; },
    ...overrides,
  };
}

function shift(overrides = {}) {
  return {
    id: 3,
    name: 'Ca test',
    startTime: '08:00:00',
    endTime: '16:00:00',
    isActive: true,
    ...overrides,
  };
}

function harness(overrides = {}) {
  const inserted = [];
  const repository = {
    acquireAssignmentLock: async () => 0,
    findOverlap: async () => null,
    sumScheduledHours: async () => 8,
    insert: async (schedule) => {
      const saved = { ...schedule, id: inserted.length + 1 };
      inserted.push(saved);
      return saved;
    },
    findInRange: async () => [],
    ...overrides.scheduleRepository,
  };
  const service = createScheduleService({
    scheduleRepository: repository,
    shiftRepository: { findById: async () => overrides.shift || shift() },
    staffService: { getForScheduling: async () => overrides.staff || staff() },
    withTransaction: overrides.withTransaction || (async (work) => work({})),
  });
  return { service, repository, inserted };
}

test('UC81 persists an active staff/active shift assignment', async () => {
  const { service, inserted } = harness();
  const result = await service.assignSchedule({ staffId: 10, shiftId: 3, workDate: '2026-11-10' });

  assert.equal(inserted.length, 1);
  assert.equal(inserted[0].status, 'assigned');
  assert.equal(result.assignmentId, 1);
  assert.equal(result.scheduledStartAt, '2026-11-10T08:00:00');
  assert.equal(result.weeklyHours.policyConfigured, false);
  assert.equal(result.weeklyHours.warning, null);
});

test('BR-70 rejects an inactive shift before persistence', async () => {
  const { service, inserted } = harness({ shift: shift({ isActive: false }) });
  await assert.rejects(
    service.assignSchedule({ staffId: 10, shiftId: 3, workDate: '2026-11-10' }),
    (error) => error.status === 422 && error.code === 'SHIFT_INACTIVE',
  );
  assert.equal(inserted.length, 0);
});

test('UC81 rejects an inactive employee before persistence', async () => {
  const { service, inserted } = harness({ staff: staff({ employmentStatus: 'resigned' }) });
  await assert.rejects(
    service.assignSchedule({ staffId: 10, shiftId: 3, workDate: '2026-11-10' }),
    (error) => error.status === 422 && error.code === 'STAFF_INACTIVE',
  );
  assert.equal(inserted.length, 0);
});

test('BR-69 returns 409 with the conflicting interval', async () => {
  const { service, inserted } = harness({
    scheduleRepository: {
      findOverlap: async () => ({
        id: 99,
        staffId: 10,
        staffName: 'Nhân viên test',
        shiftId: 2,
        shiftName: 'Ca cũ',
        startTime: '07:00:00',
        endTime: '09:00:00',
      }),
    },
  });
  await assert.rejects(
    service.assignSchedule({ staffId: 10, shiftId: 3, workDate: '2026-11-10' }),
    (error) => error.status === 409
      && error.code === 'SCHEDULE_OVERLAP'
      && error.details.startTime === '07:00:00',
  );
  assert.equal(inserted.length, 0);
});

test('half-open intervals allow adjacent shifts and reject real overlap', () => {
  assert.equal(_private.intervalsOverlap('08:00', '12:00', '12:00', '16:00'), false);
  assert.equal(_private.intervalsOverlap('08:00', '12:01', '12:00', '16:00'), true);
});

test('weekly-hours policy warns but does not block when an injected limit is exceeded', async () => {
  const { service, inserted } = harness({
    scheduleRepository: { sumScheduledHours: async () => 36 },
  });
  const result = await service.assignSchedule(
    { staffId: 10, shiftId: 3, workDate: '2026-11-10' },
    { weeklyHoursLimit: 40 },
  );
  assert.equal(inserted.length, 1);
  assert.equal(result.weeklyHours.afterAssignment, 44);
  assert.equal(result.weeklyHours.limit, 40);
  assert.match(result.weeklyHours.warning, /vượt giới hạn 40/);
});

test('concurrent equivalent assignments serialize and only one persists', async () => {
  let tail = Promise.resolve();
  const persisted = [];
  const transaction = async (work) => {
    const previous = tail;
    let release;
    tail = new Promise((resolve) => { release = resolve; });
    await previous;
    try {
      return await work({});
    } finally {
      release();
    }
  };
  const { service } = harness({
    withTransaction: transaction,
    scheduleRepository: {
      findOverlap: async ({ staffId, workDate, startTime, endTime }) => {
        const existing = persisted.find((item) => item.staffId === staffId
          && item.workDate === workDate
          && _private.intervalsOverlap(item.startTime, item.endTime, startTime, endTime));
        return existing || null;
      },
      insert: async (schedule) => {
        const saved = {
          ...schedule,
          id: persisted.length + 1,
          staffName: 'Nhân viên test',
          shiftName: 'Ca test',
          startTime: '08:00:00',
          endTime: '16:00:00',
        };
        persisted.push(saved);
        return saved;
      },
    },
  });

  const payload = { staffId: 10, shiftId: 3, workDate: '2026-11-10' };
  const results = await Promise.allSettled([
    service.assignSchedule(payload),
    service.assignSchedule(payload),
  ]);

  assert.equal(persisted.length, 1);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  const rejected = results.find((result) => result.status === 'rejected');
  assert.equal(rejected.reason.code, 'SCHEDULE_OVERLAP');
});

function checkInHarness(overrides = {}) {
  let checkInCalls = 0;
  const repository = {
    findInRange: async () => [],
    acquireCheckInLock: async () => 0,
    checkInAtomic: async ({ scheduleId, staffId, openingCash }) => {
      checkInCalls += 1;
      return {
        outcome: 'OK',
        session: {
          scheduleId,
          workingSessionId: scheduleId,
          staffId,
          status: 'working',
          attendanceRecord: 'OnTime',
          lateMinutes: 0,
          openingCash,
        },
      };
    },
    findMyTodayState: async () => ({ activeSession: null, pendingShifts: [] }),
    findActiveSalesSession: async () => null,
    ...overrides.scheduleRepository,
  };
  const service = createScheduleService({
    scheduleRepository: repository,
    shiftRepository: { findById: async () => shift() },
    staffService: { getForScheduling: async () => staff() },
    withTransaction: overrides.withTransaction || (async (work) => work({})),
  });
  return { service, repository, getCheckInCalls: () => checkInCalls };
}

const cashierUser = { userId: 1, staffId: 10, role: 'Cashier' };
const warehouseUser = { userId: 2, staffId: 11, role: 'Warehouse Staff' };

test('UC73 Cashier persists openingCash=0 and activates the assigned session', async () => {
  const { service } = checkInHarness();
  const result = await service.checkIn(22, { openingCash: 0 }, cashierUser);
  assert.equal(result.scheduleId, 22);
  assert.equal(result.status, 'working');
  assert.equal(result.openingCash, '0.00');
});

test('UC73 Cashier rejects missing, negative and NaN opening cash before persistence', async () => {
  for (const openingCash of [undefined, -1, 'NaN']) {
    const { service, getCheckInCalls } = checkInHarness();
    await assert.rejects(
      service.checkIn(22, { openingCash }, cashierUser),
      (error) => ['OPENING_CASH_REQUIRED', 'OPENING_CASH_INVALID'].includes(error.code),
    );
    assert.equal(getCheckInCalls(), 0);
  }
});

test('UC73 Warehouse checks in without opening cash and rejects a supplied drawer amount', async () => {
  const { service } = checkInHarness();
  const result = await service.checkIn(23, {}, warehouseUser);
  assert.equal(result.openingCash, null);

  await assert.rejects(
    service.checkIn(23, { openingCash: 0 }, warehouseUser),
    (error) => error.code === 'OPENING_CASH_NOT_ALLOWED',
  );
});

test('UC73 does not expose or check in another employee schedule', async () => {
  const { service } = checkInHarness({
    scheduleRepository: { checkInAtomic: async () => ({ outcome: 'NOT_FOUND', session: null }) },
  });
  await assert.rejects(
    service.checkIn(999, { openingCash: 500000 }, cashierUser),
    (error) => error.status === 404 && error.code === 'SCHEDULE_NOT_FOUND',
  );
});

test('UC73 returns recorded lateness without inventing a penalty amount', async () => {
  const { service } = checkInHarness({
    scheduleRepository: {
      checkInAtomic: async () => ({
        outcome: 'OK',
        session: {
          scheduleId: 22,
          workingSessionId: 22,
          status: 'working',
          attendanceRecord: 'Late',
          lateMinutes: 15,
          openingCash: '500000.00',
        },
      }),
    },
  });
  const result = await service.checkIn(22, { openingCash: 500000 }, cashierUser);
  assert.equal(result.attendanceRecord, 'Late');
  assert.equal(result.lateMinutes, 15);
  assert.equal(Object.hasOwn(result, 'penaltyAmount'), false);
});

test('UC73 concurrent check-in serializes and the second request is rejected', async () => {
  let tail = Promise.resolve();
  let status = 'assigned';
  let writes = 0;
  const transaction = async (work) => {
    const previous = tail;
    let release;
    tail = new Promise((resolve) => { release = resolve; });
    await previous;
    try { return await work({}); } finally { release(); }
  };
  const { service } = checkInHarness({
    withTransaction: transaction,
    scheduleRepository: {
      checkInAtomic: async ({ scheduleId, staffId, openingCash }) => {
        if (status !== 'assigned') return { outcome: 'ALREADY_CHECKED_IN', session: null };
        status = 'working';
        writes += 1;
        return {
          outcome: 'OK',
          session: { scheduleId, workingSessionId: scheduleId, staffId, openingCash, status },
        };
      },
    },
  });
  const results = await Promise.allSettled([
    service.checkIn(22, { openingCash: 100000 }, cashierUser),
    service.checkIn(22, { openingCash: 100000 }, cashierUser),
  ]);
  assert.equal(writes, 1);
  assert.equal(results.filter((item) => item.status === 'fulfilled').length, 1);
  assert.equal(results.find((item) => item.status === 'rejected').reason.code, 'ALREADY_CHECKED_IN');
});

test('BR-05 sales guard requires a Cashier working session with opening cash', async () => {
  const blocked = checkInHarness();
  await assert.rejects(
    blocked.service.requireActiveSessionForSales(cashierUser),
    (error) => error.code === 'POS_SHIFT_REQUIRED',
  );

  const allowed = checkInHarness({
    scheduleRepository: {
      findActiveSalesSession: async () => ({ scheduleId: 22, status: 'working', openingCash: '0.00' }),
    },
  });
  const session = await allowed.service.requireActiveSessionForSales(cashierUser);
  assert.equal(session.scheduleId, 22);
});

test('UC73 pending-shift lookup is scoped to the authenticated staffId', async () => {
  let requestedStaffId = null;
  const { service } = checkInHarness({
    scheduleRepository: {
      findMyTodayState: async (staffId) => {
        requestedStaffId = staffId;
        return { activeSession: null, pendingShifts: [{ scheduleId: 22, staffId }] };
      },
    },
  });
  const result = await service.getMyTodayState(cashierUser);
  assert.equal(requestedStaffId, cashierUser.staffId);
  assert.equal(result.pendingShifts[0].staffId, cashierUser.staffId);
  assert.equal(result.requiresOpeningCash, true);
});

test('UC73 rejects Manager even if a legacy permission was granted', async () => {
  const { service } = checkInHarness();
  const manager = { userId: 3, staffId: 12, role: 'Manager' };
  await assert.rejects(
    service.getMyTodayState(manager),
    (error) => error.status === 403 && error.code === 'CHECK_IN_FORBIDDEN',
  );
});
