const PROMOTION_ERRORS = Object.freeze({
  PROMOTION_NOT_FOUND: { status: 404, code: 'PROMOTION_NOT_FOUND', message: 'Không tìm thấy khuyến mãi' },
  PROMOTION_RUNNING: { status: 400, code: 'PROMOTION_RUNNING', message: 'Khuyến mãi đang chạy không thể xóa' },
});

module.exports = { PROMOTION_ERRORS };

