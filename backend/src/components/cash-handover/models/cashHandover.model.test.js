const { test } = require('node:test');
const assert = require('node:assert');
const CashHandover = require('./cashHandover.model');

test('CashHandover: balanced cash requires no note', () => {
  const h = new CashHandover({
    openingCash: 500000,
    systemCash: 1200000,
    actualCash: 1700000,
    note: null,
  });

  assert.strictEqual(h.difference(), 0);
  assert.strictEqual(h.requiresNote(), false);
  assert.strictEqual(h.hasValidNote(), true);
});

test('CashHandover: discrepancy requires note', () => {
  const h = new CashHandover({
    openingCash: 500000,
    systemCash: 1200000,
    actualCash: 1699999.99,
    note: null,
  });

  assert.strictEqual(h.hasDiscrepancy(), true);
  assert.strictEqual(h.requiresNote(), true);
  assert.strictEqual(h.hasValidNote(), false);

  h.note = 'Lệch 0.01 do làm tròn';
  assert.strictEqual(h.hasValidNote(), true);
});

test('CashHandover: lệch tiền mà note chỉ gồm khoảng trắng thì hasValidNote() trả false', () => {
  const h = new CashHandover({
    openingCash: 500000,
    systemCash: 1200000,
    actualCash: 1699999.99,
    note: '     ',
  });

  assert.strictEqual(h.hasDiscrepancy(), true);
  assert.strictEqual(h.requiresNote(), true);
  assert.strictEqual(h.hasValidNote(), false);
});

test('CashHandover: decimal arithmetic 0.1 + 0.2 precision', () => {
  const h = new CashHandover({
    openingCash: 0.1,
    systemCash: 0.2,
    actualCash: 0.3,
  });

  assert.strictEqual(h.difference(), 0);
  assert.strictEqual(h.hasDiscrepancy(), false);
});
