const { test } = require('node:test');
const assert = require('node:assert');
const LoginAccount = require('./loginAccount.model');

test('LoginAccount: active + working canLogin true', () => {
  const acc = new LoginAccount({
    userId: 1,
    isActive: 'active',
    employmentStatus: 'working',
    role: 'Cashier',
    passwordHash: 'hash',
  });
  assert.strictEqual(acc.canLogin(), true);
  assert.strictEqual(acc.isLocked(), false);
  assert.strictEqual(acc.hasResigned(), false);
});

test('LoginAccount: toSessionUser() không chứa key passwordHash', () => {
  const acc = new LoginAccount({
    userId: 1,
    username: 'testuser',
    passwordHash: 'super_secret_hash',
    isActive: 'active',
    employmentStatus: 'working',
    role: 'Cashier',
  });
  const session = acc.toSessionUser();
  assert.strictEqual('passwordHash' in session, false);
  assert.strictEqual(session.userId, 1);
});

test('LoginAccount: locked account canLogin false', () => {
  const acc = new LoginAccount({
    userId: 2,
    isActive: 'locked',
    employmentStatus: 'working',
    role: 'Cashier',
  });
  assert.strictEqual(acc.isLocked(), true);
  assert.strictEqual(acc.canLogin(), false);
});

test('LoginAccount: resigned staff canLogin false', () => {
  const acc = new LoginAccount({
    userId: 3,
    isActive: 'active',
    employmentStatus: 'resigned',
    role: 'Cashier',
  });
  assert.strictEqual(acc.hasResigned(), true);
  assert.strictEqual(acc.canLogin(), false);
});
