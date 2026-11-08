const { test } = require('node:test');
const assert = require('node:assert');
const ProductListItem = require('./productListItem.model');

test('ProductListItem: role-based DTO mapping', () => {
  const item = new ProductListItem({
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
  });

  const warehouseDto = item.toDTO('Warehouse');
  assert.strictEqual('salePrice' in warehouseDto, false);
  assert.strictEqual(warehouseDto.outOfStock, true);
  assert.strictEqual(warehouseDto.status, 'Selling');

  const cashierDto = item.toDTO('Cashier');
  assert.strictEqual('imageUrl' in cashierDto, false);
  assert.strictEqual('status' in cashierDto, false);
  assert.strictEqual(cashierDto.salePrice, 15000);

  assert.strictEqual(ProductListItem.forcedStatus('Cashier'), 'Selling');
  assert.strictEqual(ProductListItem.forcedStatus('Manager'), null);
  assert.strictEqual(ProductListItem.canSortBy('Warehouse', 'salePrice'), false);
  assert.strictEqual(ProductListItem.canSortBy('Manager', 'salePrice'), true);
});
