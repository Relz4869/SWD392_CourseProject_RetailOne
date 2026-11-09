const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const authService = require('../../auth/services/auth.service');
const service = require('../services/promotion.service');
const config = require('../../../shared/config/env');
const { signToken } = require('../../../shared/utils/jwt');
const AppError = require('../../../shared/utils/AppError');
const app = require('../../../app');
const { expandPermissions } = require('../../../shared/constants/permissions');

test('legacy PROMOTION_MANAGE expands only to the three promotion mutation permissions', () => {
  assert.deepEqual(expandPermissions(['PROMOTION_VIEW']), ['PROMOTION_VIEW']);
  assert.deepEqual(expandPermissions(['PROMOTION_MANAGE']), ['PROMOTION_MANAGE', 'PROMOTION_CREATE', 'PROMOTION_ASSIGN_PRODUCT', 'PROMOTION_DELETE']);
  assert.deepEqual(expandPermissions(null), []);
});

test('promotion HTTP authorization, validation/conflict envelopes and successful create', async (t) => {
  const previousSecret = config.jwt.secret;
  config.jwt.secret = 'promotion-tests-only-secret';
  t.after(() => { config.jwt.secret = previousSecret; });
  t.mock.method(authService, 'getActiveAccount', async (userId) => ({ userId, role: userId === 1 ? 'Manager' : 'Cashier', canLogin: () => true }));
  const create = t.mock.method(service, 'createPromotion', async () => ({ id: 77, status: 'Upcoming' }));
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api/promotions`;
  const token = (userId, permissions) => signToken({ userId, role: userId === 1 ? 'Manager' : 'Cashier', permissions });
  const permissions = ['PROMOTION_VIEW','PROMOTION_CREATE','PROMOTION_ASSIGN_PRODUCT','PROMOTION_DELETE'];
  const send = (path, method, bearer, data) => fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) }, ...(data ? { body: JSON.stringify(data) } : {}) });
  for (const [path, method] of [['','POST'], ['/1/draft','PUT'], ['/1/targets','PUT'], ['/1/targets/2','DELETE'], ['/1','DELETE']]) {
    assert.equal((await send(path, method, null)).status, 401);
    assert.equal((await send(path, method, token(2, permissions))).status, 403, 'Cashier blocked even with promotion permissions');
    assert.equal((await send(path, method, token(1, []))).status, 403, 'Manager still needs operation permission');
  }
  assert.equal(create.mock.callCount(), 0);
  const created = await send('', 'POST', token(1, permissions), { name: 'Offer' });
  assert.equal(created.status, 201);
  assert.deepEqual(await created.json(), { success: true, data: { id: 77, status: 'Upcoming' } });
  const legacyToken = token(1, ['PROMOTION_VIEW','PROMOTION_MANAGE']);
  t.mock.method(service, 'updateDraft', async () => ({ id: 77 }));
  t.mock.method(service, 'assignProducts', async () => ({ targets: [] }));
  t.mock.method(service, 'removeTarget', async () => ({ targets: [] }));
  t.mock.method(service, 'deletePromotion', async () => ({ deletion: 'hard' }));
  for (const [path, method] of [['','POST'], ['/1/draft','PUT'], ['/1/targets','PUT'], ['/1/targets/2','DELETE'], ['/1','DELETE']]) {
    const response = await send(path, method, legacyToken, method === 'DELETE' ? undefined : {});
    assert.equal(response.status, method === 'POST' ? 201 : 200, 'Existing Manager token can use promotion mutations');
    assert.equal((await send(path, method, token(2, ['PROMOTION_MANAGE']))).status, 403, 'Legacy permission still cannot bypass Manager role');
  }
  create.mock.mockImplementation(async () => { throw new AppError({ status: 400, code: 'VALIDATION_FAILED', message: 'Invalid time' }, { startDate: 'Invalid time' }); });
  const invalid = await send('', 'POST', token(1, permissions), {});
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).details.startDate, 'Invalid time');
  t.mock.method(service, 'assignProducts', async () => { throw new AppError({ status: 409, code: 'PROMOTION_OVERLAP', message: 'Confirm overlap' }, { conflicts: [{ key: 'one' }] }); });
  const overlap = await send('/1/targets', 'PUT', token(1, permissions), { productIds: [10] });
  assert.equal(overlap.status, 409);
  assert.equal((await overlap.json()).details.conflicts[0].key, 'one');
  t.mock.method(service, 'deletePromotion', async () => { throw new AppError({ status: 404, code: 'PROMOTION_ERROR', message: 'Promotion not found' }); });
  assert.equal((await send('/999','DELETE',token(1,permissions))).status, 404);
});
