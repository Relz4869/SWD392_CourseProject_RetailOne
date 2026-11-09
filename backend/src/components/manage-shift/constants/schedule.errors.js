const SCHEDULE_ERRORS = Object.freeze({
  INVALID_DATE: {
    status: 422,
    code: 'INVALID_WORK_DATE',
    message: 'Ngày làm việc không hợp lệ',
  },
  INVALID_RANGE: {
    status: 422,
    code: 'INVALID_SCHEDULE_RANGE',
    message: 'Khoảng ngày xem lịch không hợp lệ',
  },
  STAFF_NOT_FOUND: {
    status: 404,
    code: 'STAFF_NOT_FOUND',
    message: 'Không tìm thấy nhân viên',
  },
  STAFF_INACTIVE: {
    status: 422,
    code: 'STAFF_INACTIVE',
    message: 'Chỉ có thể phân ca cho nhân viên đang làm việc',
  },
  SHIFT_NOT_FOUND: {
    status: 404,
    code: 'SHIFT_NOT_FOUND',
    message: 'Không tìm thấy ca làm việc',
  },
  SHIFT_INACTIVE: {
    status: 422,
    code: 'SHIFT_INACTIVE',
    message: 'Không thể phân công ca đã ngừng hoạt động',
  },
  OVERLAP: {
    status: 409,
    code: 'SCHEDULE_OVERLAP',
    message: 'Nhân viên đã có ca trùng khung giờ',
  },
  LOCK_TIMEOUT: {
    status: 409,
    code: 'SCHEDULE_LOCK_TIMEOUT',
    message: 'Lịch đang được cập nhật, vui lòng thử lại',
  },
  CHECK_IN_FORBIDDEN: {
    status: 403,
    code: 'CHECK_IN_FORBIDDEN',
    message: 'Chỉ thu ngân hoặc nhân viên kho được bắt đầu ca',
  },
  SCHEDULE_NOT_FOUND: {
    status: 404,
    code: 'SCHEDULE_NOT_FOUND',
    message: 'Không tìm thấy ca được phân phù hợp',
  },
  ALREADY_CHECKED_IN: {
    status: 409,
    code: 'ALREADY_CHECKED_IN',
    message: 'Ca này đã được check-in',
  },
  ACTIVE_SESSION_EXISTS: {
    status: 409,
    code: 'ACTIVE_SESSION_EXISTS',
    message: 'Nhân viên đang có một ca làm việc hoạt động',
  },
  CHECK_IN_WINDOW_CLOSED: {
    status: 422,
    code: 'CHECK_IN_WINDOW_CLOSED',
    message: 'Ca hiện không nằm trong khung giờ check-in đã cấu hình',
  },
  OPENING_CASH_REQUIRED: {
    status: 422,
    code: 'OPENING_CASH_REQUIRED',
    message: 'Vui lòng nhập tiền đầu ca trước khi bán hàng',
  },
  OPENING_CASH_INVALID: {
    status: 422,
    code: 'OPENING_CASH_INVALID',
    message: 'Tiền đầu ca phải là số không âm, tối đa 2 chữ số thập phân',
  },
  OPENING_CASH_NOT_ALLOWED: {
    status: 422,
    code: 'OPENING_CASH_NOT_ALLOWED',
    message: 'Nhân viên kho không cần khai báo tiền đầu ca',
  },
  POS_SHIFT_REQUIRED: {
    status: 403,
    code: 'POS_SHIFT_REQUIRED',
    message: 'Vui lòng bắt đầu ca và ghi nhận tiền đầu ca trước khi bán hàng',
  },
});

module.exports = { SCHEDULE_ERRORS };
