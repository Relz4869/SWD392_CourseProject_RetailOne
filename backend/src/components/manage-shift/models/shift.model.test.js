const { test } = require('node:test');
const assert = require('node:assert');
const Shift = require('./shift.model');

test('Shift: check-in window boundaries', () => {
  const shift = new Shift({
    startTime: '08:00:00',
    endTime: '16:00:00',
    checkInStart: '07:30:00',
    checkInEnd: '09:00:00',
  });

  assert.strictEqual(shift.isInCheckInWindow('07:30:00'), true);
  assert.strictEqual(shift.isInCheckInWindow('09:00:00'), true);
  assert.strictEqual(shift.isInCheckInWindow('07:29:59'), false);
  assert.strictEqual(shift.isInCheckInWindow('09:00:01'), false);
});

test('Shift: fallback window when checkInStart/checkInEnd null', () => {
  const shift = new Shift({
    startTime: '08:00:00',
    endTime: '16:00:00',
    checkInStart: null,
    checkInEnd: null,
  });

  assert.strictEqual(shift.isInCheckInWindow('08:00:00'), true);
  assert.strictEqual(shift.isInCheckInWindow('16:00:00'), true);
  assert.strictEqual(shift.isInCheckInWindow('07:59:59'), false);
});

test('Shift: isLate check', () => {
  const shift = new Shift({
    startTime: '08:00:00',
    endTime: '16:00:00',
  });

  assert.strictEqual(shift.isLate('08:00:00'), false);
  assert.strictEqual(shift.isLate('08:00:01'), true);
});

test('Shift (UC75 / BR-76): hasValidTimeRange validates endTime > startTime', () => {
  // Valid range
  const validShift = new Shift({ startTime: '08:00:00', endTime: '16:00:00' });
  assert.strictEqual(validShift.hasValidTimeRange(), true);

  // Equal times (invalid)
  const equalShift = new Shift({ startTime: '08:00:00', endTime: '08:00:00' });
  assert.strictEqual(equalShift.hasValidTimeRange(), false);

  // Reverse times / overnight (invalid under BR-76)
  const reverseShift = new Shift({ startTime: '22:00:00', endTime: '06:00:00' });
  assert.strictEqual(reverseShift.hasValidTimeRange(), false);
});
