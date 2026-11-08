const { test } = require('node:test');
const assert = require('node:assert');
const ProductVariant = require('./productVariant.model');

test('ProductVariant: toBaseQuantity(2) with factor 24 returns 48', () => {
  const v = new ProductVariant({ id: 1, productId: 100, conversionFactor: 24, salePrice: 10000 });
  assert.strictEqual(v.toBaseQuantity(2), 48);
});

test('ProductVariant: changePrice creates price history', () => {
  const v = new ProductVariant({ id: 2, productId: 100, conversionFactor: 1, salePrice: 10000 });
  const history = v.changePrice(15000, 1, new Date('2026-11-10T10:00:00'));
  assert.strictEqual(v.salePrice, 15000);
  assert.strictEqual(history.oldSalePrice, 10000);
  assert.strictEqual(history.newSalePrice, 15000);
  assert.strictEqual(history.variantId, 2);
});

test('ProductVariant: changePrice with same price throws', () => {
  const v = new ProductVariant({ id: 3, productId: 100, conversionFactor: 1, salePrice: 10000 });
  assert.throws(() => v.changePrice(10000, 1));
});
