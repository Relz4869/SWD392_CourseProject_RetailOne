const SHIFT_ERRORS = Object.freeze({
  SHIFT_NOT_FOUND: { status: 404, code: 'SHIFT_NOT_FOUND', message: 'Không tìm thấy ca làm việc' },
  SCHEDULE_NOT_FOUND: { status: 404, code: 'SCHEDULE_NOT_FOUND', message: 'Không tìm thấy lịch làm việc' },
});

module.exports = { SHIFT_ERRORS };

