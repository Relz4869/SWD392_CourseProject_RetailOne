// Common error definitions: { status, code, message }. Component errors live in components/*/constants.
const ERRORS = Object.freeze({
  VALIDATION_FAILED: { status: 400, code: 'VALIDATION_FAILED', message: 'Dữ liệu không hợp lệ' },
  NOT_FOUND: { status: 404, code: 'NOT_FOUND', message: 'Không tìm thấy tài nguyên' },
  DUPLICATE: { status: 409, code: 'DUPLICATE', message: 'Dữ liệu đã tồn tại' },
  CONSTRAINT_VIOLATION: { status: 400, code: 'CONSTRAINT_VIOLATION', message: 'Vi phạm ràng buộc dữ liệu' },
  UNAUTHENTICATED: { status: 401, code: 'UNAUTHENTICATED', message: 'Chưa đăng nhập' },
  TOKEN_INVALID: { status: 401, code: 'TOKEN_INVALID', message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' },
  FORBIDDEN: { status: 403, code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này' },
  INTERNAL: { status: 500, code: 'INTERNAL', message: 'Lỗi hệ thống' },
});

module.exports = { ERRORS };

