const { test } = require('node:test');
const assert = require('node:assert/strict');
const service = require('./promotion.service');
const repo = require('../repositories/promotion.repository');
const productRepo = require('../../manage-product/repositories/product.repository');
const categoryRepo = require('../../manage-product/repositories/category.repository');
const Promotion = require('../models/promotion.model');
const Product = require('../../manage-product/models/product.model');
const Category = require('../../manage-product/models/category.model');
const PromotionProduct = require('../models/promotionProduct.model');

const now = new Date('2030-01-01T00:00:00Z');
const valid = { name: 'Offer', type: 'Percent', value: '10', startDate: '2030-02-01T10:00:00+07:00', endDate: '2030-03-01T10:00:00+07:00' };
const future = () => new Promotion({ id: 1, name: 'New offer', status: 'Active', startDate: new Date(Date.now()+86400000), endDate: new Date(Date.now()+172800000), minInvoiceValue: 0 });
const running = (props = {}) => new Promotion({ id: 2, name: 'Original', status: 'Active', startDate: new Date(Date.now()-86400000), endDate: new Date(Date.now()+86400000), minInvoiceValue: 0, ...props });
const product = new Product({ id: 10, name: 'Tea', categoryId: 3, status: 'Selling' });
const category = new Category({ id: 3, name: 'Drinks', status: true });
function fixture(t, promotion = future()) {
  const tx = Symbol('transaction');
  t.mock.method(repo, 'transaction', (work) => work(tx));
  t.mock.method(repo, 'findById', async () => promotion);
  t.mock.method(repo, 'findPromotionTargets', async () => []);
  t.mock.method(repo, 'findExclusions', async () => []);
  t.mock.method(repo, 'findOverlappingPromotions', async () => []);
  t.mock.method(productRepo, 'findPromotionCandidates', async () => [product]);
  t.mock.method(categoryRepo, 'findActiveOptions', async () => [category]);
  return tx;
}
test('UC53 required fields and invalid dates are rejected', () => {
  for (const key of ['name','type','value','startDate','endDate']) {
    assert.throws(() => service.validate({ ...valid, [key]: '' }, now), (error) => error.status === 400 && !!error.details[key]);
  }
  for (const dates of [{ startDate: '2020-01-01T00:00:00Z' }, { endDate: '2030-01-01T00:00:00Z' }, { startDate: 'garbage' }, { startDate: '2030-02-01T10:00:00' }, { endDate: '2030-02-30T10:00:00Z' }]) {
    assert.throws(() => service.validate({ ...valid, ...dates }, now), (error) => Object.values(error.details).includes('Invalid time'));
  }
});
test('UC53 validates money, percent and numeric types without rejecting zero discounts', () => {
  for (const data of [{ value: 101 }, { type: 'Amount', value: -1 }, { value: true }, { value: [] }, { value: 'NaN' }, { value: '0.001' }, { minInvoiceValue: -1 }, { maxBudget: 0 }]) {
    assert.throws(() => service.validate({ ...valid, ...data }, now), (error) => error.status === 400);
  }
  assert.equal(service.validate({ ...valid, type: 'Amount', value: 0 }, now).value, 0);
  assert.equal(service.validate({ ...valid, type: 'Percentage', value: 100 }, now).type, 'Percent');
});
test('UC53 partial drafts remain drafts at any time; optional fields stay null', () => {
  const draft = service.validate({ mode: 'draft' }, now);
  assert.equal(draft.name, null);
  assert.equal(draft.value, null);
  assert.equal(draft.isRunning(now), false);
  assert.equal(draft.effectiveStatus(new Date('2099-01-01')), 'Draft');
  assert.throws(() => service.validate({ mode: 'draft', value: -1 }, now));
});
test('UC53 server-time statuses and GMT+7 persistence do not depend on host timezone', () => {
  const p = new Promotion({ status: 'Active', startDate: new Date('2030-02-01T00:00:00Z'), endDate: new Date('2030-02-02T00:00:00Z') });
  assert.equal(p.effectiveStatus(now), 'Upcoming');
  assert.equal(p.effectiveStatus(new Date('2030-02-01T12:00:00Z')), 'Active');
  assert.equal(p.effectiveStatus(new Date('2030-03-01T00:00:00Z')), 'Expired');
  assert.equal(repo.storeTime(new Date('2030-01-01T00:00:00Z')), '2030-01-01T07:00:00.000');
});
test('UC53 create persists once and reuses a committed request on network retry', async (t) => {
  const tx = fixture(t);
  t.mock.method(repo, 'findByRequestKey', async () => null);
  const save = t.mock.method(repo, 'save', async (p, transaction) => { assert.equal(transaction, tx); p.id = 9; return p; });
  const body = { ...valid, startDate: '2090-02-01T10:00:00+07:00', endDate: '2090-03-01T10:00:00+07:00' };
  const created = await service.createPromotion(body, 'request-123');
  assert.equal(created.id, 9);
  assert.equal(created.toJSON().requestKey, undefined);
  repo.findByRequestKey.mock.mockImplementation(async () => created);
  assert.equal((await service.createPromotion(body, 'request-123')).id, 9);
  assert.equal(save.mock.callCount(), 1);
  await assert.rejects(service.createPromotion({ ...body, name: 'Changed' }, 'request-123'), (e) => e.status === 409);
});
test('UC53 save failure propagates without success, and draft updates retain the same ID', async (t) => {
  fixture(t, new Promotion({ ...future(), status: 'Draft' }));
  t.mock.method(repo, 'save', async () => { throw new Error('write failed'); });
  await assert.rejects(service.updateDraft(1, { mode: 'draft', name: 'Draft' }), /write failed/);
  repo.save.mock.mockImplementation(async (p) => p);
  const result = await service.updateDraft(1, { mode: 'draft', name: 'Draft' });
  assert.equal(result.id, 1);
  assert.equal(result.status, 'Draft');
});
test('UC53 an identical publish retry returns the saved result even after its start time, without editing a published campaign', async (t) => {
  const body = { ...valid, mode: 'publish', startDate: '2020-02-01T10:00:00+07:00', endDate: '2020-03-01T10:00:00+07:00' };
  const published = service.validate(body, new Date(0));
  published.id = 1;
  fixture(t, published);
  const save = t.mock.method(repo, 'save', async () => assert.fail('Retry must not update the published record'));
  assert.equal((await service.updateDraft(1, body)).id, 1);
  assert.equal(save.mock.callCount(), 0);
  await assert.rejects(service.updateDraft(1, { ...body, name: 'Changed' }), (e) => e.status === 409);
  await assert.rejects(service.updateDraft(1, { ...body, mode: 'draft' }), (e) => e.status === 409);
});
test('UC54 empty, inactive, missing category, and draft assignments are blocked', async (t) => {
  fixture(t);
  await assert.rejects(service.assignProducts(1, {}), /Please select at least 1 product/);
  await assert.rejects(service.assignProducts(1, { productIds: [99] }), /missing or inactive/);
  await assert.rejects(service.assignProducts(1, { categoryIds: [99] }), /missing or inactive/);
  productRepo.findPromotionCandidates.mock.mockImplementation(async () => [new Product({ ...product, status: 'Suspended' })]);
  await assert.rejects(service.assignProducts(1, { productIds: [10] }), /missing or inactive/);
  repo.findById.mock.mockImplementation(async () => new Promotion({ ...future(), status: 'Draft' }));
  await assert.rejects(service.assignProducts(1, { categoryIds: [3] }), /Publish the draft/);
});
test('UC54 duplicates are collapsed and multi-target writes use one transaction', async (t) => {
  const tx = fixture(t);
  const save = t.mock.method(repo, 'savePromotionTargets', async (promotionId, targets, transaction) => {
    assert.equal(transaction, tx); assert.equal(promotionId, 1); assert.equal(targets.length, 2);
  });
  const result = await service.assignProducts(1, { productIds: [10,10], categoryIds: [3,3] });
  assert.equal(save.mock.callCount(), 1);
  assert.equal(result.outcomes.length, 2);
  assert.deepEqual(result.outcomes.map((o) => o.targetName), ['Tea','Drinks']);
});
function overlapFixture(t, categoryLink = false) {
  fixture(t);
  const old = running();
  const link = new PromotionProduct({ id: 7, promotionId: 2, productId: categoryLink ? null : 10, categoryId: categoryLink ? 3 : null });
  repo.findOverlappingPromotions.mock.mockImplementation(async () => [old]);
  repo.findPromotionTargets.mock.mockImplementation(async (promotionId) => promotionId === 2 ? [link] : []);
  return { old, link };
}
test('UC54 overlap requires confirmation, and stale overwrite confirmation warns again', async (t) => {
  overlapFixture(t);
  const save = t.mock.method(repo, 'savePromotionTargets', async () => {});
  for (const data of [{ productIds: [10] }, { productIds: [10], resolution: 'overwrite', conflictKeys: ['stale'] }]) {
    await assert.rejects(service.assignProducts(1, data), (e) => e.status === 409 && e.details.conflicts[0].message === 'Product Tea is in promotion Original. Confirm overwrite or keep original?');
  }
  assert.equal(save.mock.callCount(), 0);
});
test('UC54 Keep original does not remove existing links or assign conflicting targets', async (t) => {
  overlapFixture(t);
  const remove = t.mock.method(repo, 'removeTarget', async () => assert.fail('must not remove'));
  t.mock.method(repo, 'savePromotionTargets', async (promotionId, targets) => assert.equal(targets.length, 0));
  const result = await service.assignProducts(1, { productIds: [10], resolution: 'keep', conflictKeys: ['productId:10:7:10'] });
  assert.equal(remove.mock.callCount(), 0);
  assert.match(result.outcomes[0].result, /Kept original/);
});
test('UC54 overwrite excludes a product from an old category without removing the category', async (t) => {
  overlapFixture(t, true);
  const exclude = t.mock.method(repo, 'excludeProduct', async (promotionId, productId) => { assert.equal(promotionId, 2); assert.equal(productId, 10); });
  const remove = t.mock.method(repo, 'removeTarget', async () => assert.fail('must preserve category link'));
  t.mock.method(repo, 'savePromotionTargets', async () => {});
  await service.assignProducts(1, { productIds: [10], resolution: 'overwrite', conflictKeys: ['productId:10:7:10'] });
  assert.equal(exclude.mock.callCount(), 1); assert.equal(remove.mock.callCount(), 0);
});
test('UC54 category overwrite removes an old direct link atomically and reports target result', async (t) => {
  overlapFixture(t);
  const remove = t.mock.method(repo, 'removeTarget', async (promotionId, linkId) => { assert.equal(promotionId, 2); assert.equal(linkId, 7); });
  t.mock.method(repo, 'savePromotionTargets', async () => {});
  const result = await service.assignProducts(1, { categoryIds: [3], resolution: 'overwrite', conflictKeys: ['categoryId:3:7:10'] });
  assert.equal(remove.mock.callCount(), 1);
  assert.equal(result.outcomes[0].result, 'Assigned');
});
test('UC54 empty categories still conflict over future products', () => {
  const conflicts = service.conflictsFor([{ categoryId: 3, key: 'categoryId:3' }], [], [category], [{ promotion: running(), links: [{ id: 7, categoryId: 3 }] }], []);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].productId, null);
});
test('UC54 category assignment detects a direct link on an inactive member before later reactivation', () => {
  const inactive = new Product({ ...product, status: 'StopSelling' });
  const conflicts = service.conflictsFor([{ categoryId: 3, key: 'categoryId:3' }], [inactive], [category], [{ promotion: running(), links: [{ id: 7, productId: 10 }] }], []);
  assert.equal(conflicts.length, 1);
});
test('UC54 removal persists immediately and category-derived IDs cannot masquerade as direct links', async (t) => {
  fixture(t);
  repo.findPromotionTargets.mock.mockImplementation(async () => [new PromotionProduct({ id: 7, productId: 10 })]);
  const remove = t.mock.method(repo, 'removeTarget', async () => {});
  await service.removeTarget(1, 7);
  assert.equal(remove.mock.callCount(), 1);
  await assert.rejects(service.removeTarget(1, 10), (e) => e.status === 404);
});
test('UC54 live sales resolution includes future category members and excludes drafts/deleted/inactive/minimum failures', async (t) => {
  fixture(t);
  const active = running();
  t.mock.method(repo, 'findAll', async () => [active, running({ id: 3, status: 'Draft' }), running({ id: 4, status: 'Deleted' }), running({ id: 5, status: 'Disabled' }), running({ id: 6, minInvoiceValue: 9999 })]);
  repo.findPromotionTargets.mock.mockImplementation(async () => [new PromotionProduct({ categoryId: 3 })]);
  assert.deepEqual((await service.findApplicablePromotions(10, 100)).map((p) => p.id), [2]);
  const futureProduct = new Product({ id: 11, name: 'New tea', categoryId: 3, status: 'Selling' });
  productRepo.findPromotionCandidates.mock.mockImplementation(async () => [product, futureProduct]);
  assert.deepEqual((await service.findApplicablePromotions(11, 100)).map((p) => p.id), [2]);
  repo.findExclusions.mock.mockImplementation(async () => [{ promotionId: 2, productId: 11 }]);
  assert.equal((await service.findApplicablePromotions(11, 100)).length, 0);
  productRepo.findPromotionCandidates.mock.mockImplementation(async () => [new Product({ ...product, status: 'StopSelling' })]);
  assert.equal((await service.findApplicablePromotions(10, 100)).length, 0);
});
test('UC56 active block happens before checking invoice history', async (t) => {
  fixture(t, running());
  const usage = t.mock.method(repo, 'invoiceUsage', async () => assert.fail('active check must happen first'));
  await assert.rejects(service.deletePromotion(2), (e) => e.status === 409 && e.message === 'Cannot delete an ongoing promotion. Please stop it first');
  assert.equal(usage.mock.callCount(), 0);
});
test('UC56 hard delete, paid-history soft delete, and other-reference soft delete', async (t) => {
  const tx = fixture(t);
  t.mock.method(repo, 'invoiceUsage', async () => ({ referencesCount: 0, paidCount: 0 }));
  const deletion = t.mock.method(repo, 'deleteOrHide', async (promotionId, soft, transaction) => assert.equal(transaction, tx));
  assert.equal((await service.deletePromotion(1)).deletion, 'hard');
  assert.equal(deletion.mock.calls[0].arguments[1], false);
  repo.invoiceUsage.mock.mockImplementation(async () => ({ referencesCount: 1, paidCount: 1 }));
  assert.equal((await service.deletePromotion(1)).reason, 'Paid invoice history preserved');
  assert.equal(deletion.mock.calls[1].arguments[1], true);
  repo.invoiceUsage.mock.mockImplementation(async () => ({ referencesCount: 1, paidCount: 0 }));
  assert.equal((await service.deletePromotion(1)).reason, 'Other invoice references preserved');
});
test('UC56 missing/deleted IDs return 404; persistence failures are never reported as success', async (t) => {
  fixture(t);
  repo.findById.mock.mockImplementation(async () => null);
  await assert.rejects(service.deletePromotion(1), (e) => e.status === 404);
  repo.findById.mock.mockImplementation(async () => new Promotion({ id: 1, status: 'Deleted' }));
  await assert.rejects(service.deletePromotion(1), (e) => e.status === 404);
  repo.findById.mock.mockImplementation(async () => future());
  t.mock.method(repo, 'invoiceUsage', async () => ({ referencesCount: 0, paidCount: 0 }));
  t.mock.method(repo, 'deleteOrHide', async () => { throw new Error('delete failed'); });
  await assert.rejects(service.deletePromotion(1), /delete failed/);
});
test('ID validation rejects SQL fragments and unsafe integers', () => {
  for (const value of ['1; DROP TABLE Promotions', -1, null, '1.1', '9007199254740992']) assert.throws(() => service.id(value));
});
