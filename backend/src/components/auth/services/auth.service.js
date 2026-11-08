const userRepository = require('../repositories/user.repository');
const AppError = require('../../../shared/utils/AppError');
const { AUTH_ERRORS } = require('../constants/auth.errors');
const { comparePassword } = require('../../../shared/utils/password');
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

// eslint-disable-next-line no-unused-vars
async function createAccount({ username, password, roleName }, tx) {
  throw new Error('Not implemented');
}

// eslint-disable-next-line no-unused-vars
async function setAccountStatus(userId, status, tx) {
  throw new Error('Not implemented');
}

module.exports = {
  login,
  getSession,
  getActiveAccount,
  createAccount,
  setAccountStatus,
};
