const { test } = require('node:test');
const assert = require('node:assert');
const Promotion = require('./promotion.model');

const now = new Date('2026-11-10T10:00:00');
const make = (props) =>
  new Promotion({
    status: 'Active',
    startDate: new Date('2026-11-01T00:00:00'),
    endDate: new Date('2026-11-30T23:59:59'),
    ...props,
  });

test('running promotion cannot be deleted (UC56)', () => {
  assert.strictEqual(make().canBeDeleted(now), false);
});

test('upcoming promotion can be deleted (UC56)', () => {
  const p = make({
    startDate: new Date('2026-12-01T00:00:00'),
    endDate: new Date('2026-12-31T23:59:59'),
  });
  assert.strictEqual(p.canBeDeleted(now), true);
});

test('disabled promotion during running period can be deleted', () => {
  const p = make({ status: 'Disabled' });
  assert.strictEqual(p.canBeDeleted(now), true);
});

test('already deleted promotion cannot be deleted again', () => {
  const p = make({ status: 'Deleted' });
  assert.strictEqual(p.canBeDeleted(now), false);
});

test('markDeleted on running promotion throws', () => {
  assert.throws(() => make().markDeleted(now));
});
