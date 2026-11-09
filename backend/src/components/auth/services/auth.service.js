const userRepository = require('../repositories/user.repository');
const AppError = require('../../../shared/utils/AppError');
const { AUTH_ERRORS } = require('../constants/auth.errors');
const { comparePassword, hashPassword } = require('../../../shared/utils/password');
const { withTransaction } = require('../../../shared/config/database');
const { ERRORS } = require('../../../shared/constants/errors');
const { signToken } = require('../../../shared/utils/jwt');
const { jwt: jwtConfig } = require('../../../shared/config/env');

async function login(username, password) {
  const account = await userRepository.findLoginAccountByUsername(username);

  // E2: same error whether the username or the password is wrong
  if (!account || !(await comparePassword(password, account.passwordHash))) {
    throw new AppError(AUTH_ERRORS.INVALID_CREDENTIALS);
  }

  // E3 + E4: checked only after the password is correct
  if (!account.canLogin()) {
    throw new AppError(AUTH_ERRORS.ACCOUNT_LOCKED);
  }

  const permissions = await userRepository.findPermissionKeysByRoleId(account.roleId);
  const token = signToken({ ...account.toTokenPayload(), permissions });

  return {
    token,
    expiresIn: jwtConfig.expiresInByRole[account.role] || '12h',
    user: account.toSessionUser(),
    permissions,
  };
}

async function getSession(userId) {
  const account = await userRepository.findLoginAccountById(userId);
  if (!account || !account.canLogin()) {
    throw new AppError(AUTH_ERRORS.ACCOUNT_LOCKED);
  }
  const permissions = await userRepository.findPermissionKeysByRoleId(account.roleId);
  return {
    user: account.toSessionUser(),
    permissions,
  };
}

async function getActiveAccount(userId) {
  return userRepository.findLoginAccountById(userId);
}

// Minimal first-login integration for accounts created by UC64.
async function changePassword(userId, data) {
  const errors={};
  if (typeof data?.currentPassword!=='string' || !data.currentPassword || Buffer.byteLength(data.currentPassword,'utf8')>72) errors.currentPassword='Vui lòng nhập mật khẩu hiện tại hợp lệ';
  if (typeof data?.newPassword!=='string' || data.newPassword.length<12 || Buffer.byteLength(data.newPassword,'utf8')>72) errors.newPassword='Mật khẩu mới cần ít nhất 12 ký tự và tối đa 72 byte';
  if (Object.keys(errors).length) throw new AppError(ERRORS.VALIDATION_FAILED,errors);
  const account=await userRepository.findLoginAccountById(userId);
  if (!account || !account.canLogin()) throw new AppError(AUTH_ERRORS.ACCOUNT_LOCKED);
  if (!await comparePassword(data.currentPassword,account.passwordHash)) throw new AppError(ERRORS.VALIDATION_FAILED,{currentPassword:'Mật khẩu hiện tại không đúng'});
  if (await comparePassword(data.newPassword,account.passwordHash)) throw new AppError(ERRORS.VALIDATION_FAILED,{newPassword:'Mật khẩu mới phải khác mật khẩu hiện tại'});
  const hash=await hashPassword(data.newPassword);
  await withTransaction(async tx=>{
    if (!await userRepository.updatePassword(userId,hash,tx)) throw new AppError(ERRORS.TOKEN_INVALID);
  });
  const updated=await userRepository.findLoginAccountById(userId);
  if (!updated?.canLogin()) throw new AppError(AUTH_ERRORS.ACCOUNT_LOCKED);
  const permissions=await userRepository.findPermissionKeysByRoleId(updated.roleId);
  return {token:signToken({...updated.toTokenPayload(),permissions}),user:updated.toSessionUser(),permissions,
    expiresIn:jwtConfig.expiresInByRole[updated.role] || '12h'};
}

// eslint-disable-next-line no-unused-vars
async function createAccount({ username, password, roleName }, tx) {
  throw new Error('Not implemented');
}

// eslint-disable-next-line no-unused-vars
async function setAccountStatus(userId, status, tx) {
  throw new Error('Not implemented');
}

module.exports = {
  changePassword,
  login,
  getSession,
  getActiveAccount,
  createAccount,
  setAccountStatus,
};
