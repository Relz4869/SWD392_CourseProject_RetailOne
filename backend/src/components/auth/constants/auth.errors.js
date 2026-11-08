const AUTH_ERRORS = Object.freeze({
  INVALID_CREDENTIALS: {
    status: 401,
    code: 'INVALID_CREDENTIALS',
    message: 'Sai tên đăng nhập hoặc mật khẩu.',
  },
  ACCOUNT_LOCKED: {
    status: 403,
    code: 'ACCOUNT_LOCKED',
    message: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản lý.',
  },
});

module.exports = { AUTH_ERRORS };
