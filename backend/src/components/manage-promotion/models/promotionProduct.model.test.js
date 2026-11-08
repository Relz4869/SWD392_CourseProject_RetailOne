const { test } = require('node:test');
const assert = require('node:assert');
const PromotionProduct = require('./promotionProduct.model');

test('PromotionProduct: only productId is valid', () => {
  const pp = new PromotionProduct({ promotionId: 1, productId: 10, categoryId: null, variantId: null });
  assert.strictEqual(pp.isValidTarget(), true);
});

test('PromotionProduct: both productId and categoryId is invalid', () => {
  const pp = new PromotionProduct({ promotionId: 1, productId: 10, categoryId: 2, variantId: null });
  assert.strictEqual(pp.isValidTarget(), false);
});

test('PromotionProduct: variantId without productId is invalid', () => {
  const pp = new PromotionProduct({ promotionId: 1, productId: null, categoryId: 2, variantId: 5 });
  assert.strictEqual(pp.isValidTarget(), false);
});

test('PromotionProduct: variantId with productId is valid', () => {
  const pp = new PromotionProduct({ promotionId: 1, productId: 10, categoryId: null, variantId: 5 });
  assert.strictEqual(pp.isValidTarget(), true);
});
