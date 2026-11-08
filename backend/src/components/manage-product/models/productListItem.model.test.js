const { test } = require('node:test');
const assert = require('node:assert');
const ProductListItem = require('./productListItem.model');

const makeItem = (props = {}) =>
  new ProductListItem({
    id: 1,
    code: 'SP001',
    name: 'Product 1',
    imageUrl: 'http://img',
    categoryId: 2,
    categoryName: 'Drinks',
    baseUnit: 'Can',
    baseVariantId: 10,
    salePrice: 15000,
    barcode: '123456',
    stockInBaseUnit: 0,
    variantCount: 2,
    status: 'Selling',
    createdAt: new Date(),
    ...props,
  });

test('ProductListItem: Warehouse không có salePrice', () => {
  const item = makeItem();
  const dto = item.toDTO('Warehouse');
  assert.strictEqual('salePrice' in dto, false);
});

test('ProductListItem: Cashier không có imageUrl', () => {
  const item = makeItem();
  const dto = item.toDTO('Cashier');
  assert.strictEqual('imageUrl' in dto, false);
});

test("ProductListItem: forcedStatus('Cashier') === 'Selling'", () => {
  assert.strictEqual(ProductListItem.forcedStatus('Cashier'), 'Selling');
  assert.strictEqual(ProductListItem.forcedStatus('Manager'), null);
});

test("ProductListItem: canSortBy('Warehouse', 'salePrice') === false", () => {
  assert.strictEqual(ProductListItem.canSortBy('Warehouse', 'salePrice'), false);
  assert.strictEqual(ProductListItem.canSortBy('Manager', 'salePrice'), true);
});

test('ProductListItem: tồn kho 0 thì outOfStock === true', () => {
  const itemZero = makeItem({ stockInBaseUnit: 0 });
  assert.strictEqual(itemZero.isOutOfStock(), true);
  assert.strictEqual(itemZero.toDTO('Cashier').outOfStock, true);

  const itemPositive = makeItem({ stockInBaseUnit: 10 });
  assert.strictEqual(itemPositive.isOutOfStock(), false);
  assert.strictEqual(itemPositive.toDTO('Cashier').outOfStock, false);
});
