const authService = require('../services/auth.service');
const { verifyToken } = require('../../../shared/utils/jwt');
const AppError = require('../../../shared/utils/AppError');
const { ERRORS } = require('../../../shared/constants/errors');
const { AUTH_ERRORS } = require('../constants/auth.errors');
const { expandPermissions } = require('../../../shared/constants/permissions');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError(ERRORS.UNAUTHENTICATED));
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return next(new AppError(ERRORS.TOKEN_INVALID));
    }

    const account = await authService.getActiveAccount(payload.userId);
    if (!account || !account.canLogin()) {
      return next(new AppError(AUTH_ERRORS.ACCOUNT_LOCKED));
    }
    if ((payload.tokenVersion ?? 0) !== (account.tokenVersion ?? 0)) {
      return next(new AppError(ERRORS.TOKEN_INVALID));
    }
    const passwordChangeRequired = typeof account.mustChangePassword === 'function'
      ? account.mustChangePassword() : Boolean(account.requirePasswordChange);
    const passwordAccess = req.baseUrl === '/api/auth' && ['/me','/change-password'].includes(req.path);
    if (passwordChangeRequired && !passwordAccess) {
      return next(new AppError({ status: 403, code: 'PASSWORD_CHANGE_REQUIRED', message: 'Bạn cần đổi mật khẩu trước khi sử dụng hệ thống.' }));
    }

    req.user = {
      userId: account.userId,
      staffId: account.staffId,
      role: account.role,
      tokenVersion: account.tokenVersion ?? 0,
      permissions: expandPermissions(payload.permissions),
    };

    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = authenticate;
