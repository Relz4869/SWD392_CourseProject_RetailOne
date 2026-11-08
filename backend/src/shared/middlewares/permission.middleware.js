const AppError = require('../utils/AppError');
const { ERRORS } = require('../constants/errors');

/**
 * protect(...permissionKeys): allow if the user has at least one of the keys.
 * Must run after auth's `authenticate`, which sets req.user.permissions.
 */
function protect(...permissionKeys) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError(ERRORS.UNAUTHENTICATED));
    const granted = Array.isArray(req.user.permissions) ? req.user.permissions : [];
    const allowed = permissionKeys.length === 0 || permissionKeys.some((key) => granted.includes(key));
    return allowed ? next() : next(new AppError(ERRORS.FORBIDDEN));
  };
}

module.exports = { protect };

