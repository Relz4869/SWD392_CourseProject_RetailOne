const CASH_HANDOVER_ERRORS = Object.freeze({
  HANDOVER_NOT_FOUND: { status: 404, code: 'HANDOVER_NOT_FOUND', message: 'Không tìm thấy bàn giao tiền' },
  CASHIER_ONLY: { status: 403, code: 'CASHIER_ONLY', message: 'Chỉ thu ngân được kiểm đếm bàn giao tiền' },
  ACTIVE_SESSION_REQUIRED: { status: 409, code: 'ACTIVE_SESSION_REQUIRED', message: 'Vui lòng bắt đầu ca trước khi bàn giao tiền' },
  OPENING_CASH_REQUIRED: { status: 409, code: 'OPENING_CASH_REQUIRED', message: 'Phiên làm việc chưa ghi nhận tiền đầu ca' },
  COUNT_INVALID: { status: 422, code: 'COUNT_INVALID', message: 'Số lượng mệnh giá không hợp lệ' },
  COUNT_ALREADY_SEALED: { status: 409, code: 'COUNT_ALREADY_SEALED', message: 'Kết quả kiểm đếm đã được lưu và không thể ghi đè' },
  LOCK_TIMEOUT: { status: 409, code: 'HANDOVER_LOCK_TIMEOUT', message: 'Không thể khóa phiên bàn giao, vui lòng thử lại' },
  SALES_CONTRACT_UNAVAILABLE: {
    status: 503,
    code: 'SALES_CASH_LEDGER_UNAVAILABLE',
    message: 'Không thể đối soát tiền lúc này. Vui lòng thử lại sau',
  },
  REPORT_MANAGER_ONLY: { status: 403, code: 'REPORT_MANAGER_ONLY', message: 'Chỉ quản lý được xem báo cáo bàn giao tiền' },
  REPORT_FILTER_INVALID: { status: 422, code: 'REPORT_FILTER_INVALID', message: 'Bộ lọc báo cáo không hợp lệ' },
});

module.exports = { CASH_HANDOVER_ERRORS };
