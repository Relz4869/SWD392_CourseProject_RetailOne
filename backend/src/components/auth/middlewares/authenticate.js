const authService = require('../services/auth.service');
const { verifyToken } = require('../../../shared/utils/jwt');
const AppError = require('../../../shared/utils/AppError');
const { ERRORS } = require('../../../shared/constants/errors');
const { AUTH_ERRORS } = require('../constants/auth.errors');

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

    req.user = {
      userId: account.userId,
      staffId: account.staffId,
      role: account.role,
      permissions: payload.permissions || [],
    };

    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = authenticate;
