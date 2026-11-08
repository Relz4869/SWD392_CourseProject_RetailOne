const { test } = require('node:test');
const assert = require('node:assert');
const WorkSchedule = require('./workSchedule.model');
const Shift = require('./shift.model');

const shift = new Shift({
  startTime: '08:00:00',
  endTime: '16:00:00',
  checkInStart: '07:30:00',
  checkInEnd: '09:00:00',
});

test('WorkSchedule: checkIn on time', () => {
  const now = new Date('2026-11-10T07:55:00');
  const ws = new WorkSchedule({
    id: 1,
    staffId: 5,
    shiftId: 1,
    workDate: '2026-11-10',
    status: 'assigned',
  });

  assert.strictEqual(ws.canCheckIn(now, shift), true);
  ws.checkIn(now, shift, 500000);
  assert.strictEqual(ws.status, 'working');
  assert.strictEqual(ws.attendanceRecord, 'OnTime');
  assert.strictEqual(ws.openingCash, 500000);
});

test('WorkSchedule: checkIn late', () => {
  const now = new Date('2026-11-10T08:15:00');
  const ws = new WorkSchedule({
    id: 2,
    staffId: 5,
    shiftId: 1,
    workDate: '2026-11-10',
    status: 'assigned',
  });

  ws.checkIn(now, shift);
  assert.strictEqual(ws.attendanceRecord, 'Late');
});

test('WorkSchedule: different date cannot check in', () => {
  const now = new Date('2026-11-11T08:00:00');
  const ws = new WorkSchedule({
    id: 3,
    staffId: 5,
    shiftId: 1,
    workDate: '2026-11-10',
    status: 'assigned',
  });

  assert.strictEqual(ws.canCheckIn(now, shift), false);
});

test('WorkSchedule: complete calculates workedHours', () => {
  const checkIn = new Date('2026-11-10T08:00:00');
  const checkOut = new Date('2026-11-10T16:00:00');
  const ws = new WorkSchedule({
    id: 4,
    staffId: 5,
    status: 'working',
    checkInTime: checkIn,
  });

  assert.strictEqual(ws.canHandOver(), true);
  ws.complete(checkOut);
  assert.strictEqual(ws.status, 'completed');
  assert.strictEqual(ws.workedHours, 8);
});
